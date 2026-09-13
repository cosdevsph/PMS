package com.malasakit.clinic.data.repository

import android.content.Context
import android.os.Build
import android.util.Log
import com.malasakit.clinic.data.api.GatewayApiService
import com.malasakit.clinic.data.api.NetworkClient
import com.malasakit.clinic.data.api.models.DeliveryReportRequest
import com.malasakit.clinic.data.api.models.HeartbeatRequest
import com.malasakit.clinic.data.api.models.HeartbeatResponse
import com.malasakit.clinic.data.api.models.InboundSMSReportRequest
import com.malasakit.clinic.data.api.models.PairingRequest
import com.malasakit.clinic.data.api.models.PairingResponse
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.local.db.AppDatabase
import com.malasakit.clinic.data.local.db.SMSEntity
import com.malasakit.clinic.util.DeviceHardwareHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Main Repository coordinating network synchronization, database message buffering,
 * and device lifecycle states.
 */
class GatewayRepository(
    private val context: Context,
    private val preferences: AppPreferences = AppPreferences(context),
    private val database: AppDatabase = AppDatabase.getInstance(context)
) {

    private val apiService: GatewayApiService
        get() = NetworkClient.getApiService(context)

    private val smsDao = database.smsDao()

    /**
     * Executes the pairing handshake with the backend using a 10-minute pairing token or 8-character MAL-XXXX code.
     */
    suspend fun pairWithToken(pairingTokenOrCode: String, customDeviceName: String? = null): Result<PairingResponse> = withContext(Dispatchers.IO) {
        try {
            val simCards = DeviceHardwareHelper.detectSimCards(context)
            val carrier1 = simCards.getOrNull(0)?.carrierName
            val defaultName = customDeviceName?.takeIf { it.isNotBlank() }
                ?: "${Build.MANUFACTURER} ${Build.MODEL}"

            val trimmed = pairingTokenOrCode.trim()
            val isManualCode = trimmed.startsWith("MAL-", ignoreCase = true) || trimmed.length <= 10

            val request = PairingRequest(
                pairingToken = if (!isManualCode) trimmed else null,
                pairingCode = if (isManualCode) trimmed.uppercase() else null,
                deviceIdentifier = DeviceHardwareHelper.getDeviceFingerprint(context),
                deviceName = defaultName,
                modelName = "${Build.MANUFACTURER} ${Build.MODEL}",
                androidVersion = Build.VERSION.RELEASE,
                appVersion = "1.0.0",
                simCarrier = carrier1,
                simSlotIndex = simCards.getOrNull(0)?.slotIndex ?: 0,
                simSubscriptionId = simCards.getOrNull(0)?.subscriptionId,
                phoneNumber = "",
                smsCapable = true
            )

            val response = apiService.pairDevice(request)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && !body.deviceToken.isNullOrBlank()) {
                    // Persist credentials securely
                    preferences.deviceToken = body.deviceToken
                    preferences.deviceId = body.deviceId
                    preferences.deviceName = defaultName
                    preferences.clinicId = body.clinicId ?: -1L
                    preferences.clinicName = body.clinicName
                    preferences.simCarrier = carrier1
                    preferences.simPhoneNumber = request.phoneNumber
                    preferences.isPaired = true

                    Log.i(TAG, "Device successfully paired to Clinic: ${body.clinicName} (ID: ${body.clinicId})")
                    Result.success(body)
                } else {
                    Result.failure(Exception(body.error ?: body.message ?: "Pairing failed: Invalid response"))
                }
            } else {
                val errorRaw = response.errorBody()?.string() ?: "Pairing rejected (HTTP ${response.code()})"
                val cleanError = try {
                    val map = com.google.gson.JsonParser.parseString(errorRaw).asJsonObject
                    map.get("error")?.asString
                        ?: map.get("detail")?.asString
                        ?: map.entrySet().firstOrNull()?.value?.asString
                        ?: errorRaw
                } catch (e: Exception) {
                    errorRaw
                }
                Result.failure(Exception(cleanError))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during device pairing", e)
            Result.failure(e)
        }
    }

    /**
     * Reports device battery, network, and SIM card telemetry to the backend.
     */
    suspend fun sendHeartbeat(): Result<HeartbeatResponse> = withContext(Dispatchers.IO) {
        try {
            val simCards = DeviceHardwareHelper.detectSimCards(context)
            val request = HeartbeatRequest(
                batteryLevel = DeviceHardwareHelper.getBatteryLevel(context),
                isCharging = DeviceHardwareHelper.isDeviceCharging(context),
                networkType = DeviceHardwareHelper.getNetworkType(context),
                simCarrier = simCards.getOrNull(0)?.carrierName,
                simCarrier2 = simCards.getOrNull(1)?.carrierName,
                appVersion = "1.0.0"
            )

            val response = apiService.sendHeartbeat(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Heartbeat failed with HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Atomically claims pending outbound messages from the backend queue and stores in local Room DB.
     */
    suspend fun fetchPendingQueue(): Result<Int> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.fetchQueue(limit = 10)
            if (response.isSuccessful && response.body() != null) {
                val items = response.body()!!.messages
                if (items.isNotEmpty()) {
                    val entities = items.map { item ->
                        SMSEntity(
                            remoteMessageId = item.id,
                            recipientOrSender = item.recipient,
                            messageBody = item.message,
                            direction = "OUTBOUND",
                            priority = item.priority,
                            status = "QUEUED",
                            simSlot = item.simSlot
                        )
                    }
                    smsDao.insertAll(entities)
                    Log.i(TAG, "Claimed and queued ${items.size} messages from backend")
                }
                Result.success(items.size)
            } else {
                Result.failure(Exception("Queue fetch returned HTTP ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Reports delivery status (DELIVERED or FAILED) to backend webhook.
     */
    suspend fun reportDelivery(
        messageId: String,
        status: String,
        carrierErrorCode: String? = null,
        errorMessage: String? = null,
        sentAt: Long? = null,
        deliveredAt: Long? = null
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }

            val request = DeliveryReportRequest(
                messageId = messageId,
                status = status,
                carrierErrorCode = carrierErrorCode,
                errorMessage = errorMessage,
                sentAt = sentAt?.let { isoFormat.format(Date(it)) },
                deliveredAt = deliveredAt?.let { isoFormat.format(Date(it)) }
            )

            val response = apiService.reportDelivery(request)
            if (response.isSuccessful) {
                // Mark as reported in local DB
                val localMsg = smsDao.getByRemoteId(messageId)
                if (localMsg != null) {
                    smsDao.update(localMsg.copy(reportedToServer = true))
                }
                Result.success(Unit)
            } else {
                Result.failure(Exception("Webhook delivery report failed (HTTP ${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Reports incoming patient reply SMS to backend inbound webhook.
     */
    suspend fun reportInboundSMS(
        sender: String,
        message: String,
        simSlot: Int = 0,
        receivedAt: Long = System.currentTimeMillis(),
        messageId: String = java.util.UUID.randomUUID().toString(),
        existingLocalId: Long? = null
    ): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }

            // Save inbound locally first if not already saved
            val localId = existingLocalId ?: smsDao.insert(
                SMSEntity(
                    remoteMessageId = messageId,
                    recipientOrSender = sender,
                    messageBody = message,
                    direction = "INBOUND",
                    status = "DELIVERED",
                    simSlot = simSlot,
                    createdAt = receivedAt,
                    reportedToServer = false
                )
            )

            val recipientNumber = preferences.simPhoneNumber
                ?: preferences.clinicName
                ?: "Clinic Gateway"

            val request = InboundSMSReportRequest(
                messageId = messageId,
                sender = sender,
                recipient = recipientNumber,
                message = message,
                receivedAt = isoFormat.format(Date(receivedAt)),
                simSlot = simSlot
            )

            val response = apiService.reportInboundSMS(request)
            if (response.isSuccessful) {
                val saved = smsDao.getById(localId)
                if (saved != null) {
                    smsDao.update(saved.copy(reportedToServer = true, remoteMessageId = messageId))
                }
                Log.i(TAG, "Reported inbound SMS $messageId from $sender to server successfully")
                Result.success(Unit)
            } else {
                Log.w(TAG, "Inbound webhook failed (HTTP ${response.code()})")
                Result.failure(Exception("Inbound webhook failed (HTTP ${response.code()})"))
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reporting inbound SMS", e)
            Result.failure(e)
        }
    }

    /**
     * Disconnects this device from the clinic and clears local credentials.
     */
    suspend fun disconnectDevice(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            apiService.disconnectDevice()
        } catch (ignored: Exception) {
            // Even if server unreachable, we still clear locally
        }
        com.malasakit.clinic.service.HeartbeatWorker.cancel(context)
        preferences.clearPairing()
        Result.success(Unit)
    }

    // Observables for UI
    fun observePendingCount(): Flow<Int> = smsDao.observePendingCount()
    fun observeRecentLogs(limit: Int = 50): Flow<List<SMSEntity>> = smsDao.getRecentLogs(limit)

    fun observeSentTodayCount(): Flow<Int> {
        val midnight = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        return smsDao.observeSentTodayCount(midnight)
    }

    fun observeFailedTodayCount(): Flow<Int> {
        val midnight = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
        return smsDao.observeFailedTodayCount(midnight)
    }

    companion object {
        private const val TAG = "GatewayRepository"
    }
}
