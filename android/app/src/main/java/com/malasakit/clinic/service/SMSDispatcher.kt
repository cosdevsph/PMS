package com.malasakit.clinic.service

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.local.db.AppDatabase
import com.malasakit.clinic.data.local.db.SMSEntity
import com.malasakit.clinic.data.repository.GatewayRepository
import com.malasakit.clinic.util.DeviceHardwareHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.util.regex.Pattern

/**
 * Robust SMS Dispatcher Engine managing multipart message segmentation,
 * dual-SIM subscription routing, carrier error mapping, and exponential retry backoff.
 */
class SMSDispatcher(private val context: Context) {

    private val preferences = AppPreferences(context)
    private val database = AppDatabase.getInstance(context)
    private val smsDao = database.smsDao()
    private val repository = GatewayRepository(context, preferences, database)

    /**
     * Prepares, segments, and dispatches a single outbound SMS message.
     */
    fun dispatchMessage(sms: SMSEntity) {
        val rawRecipient = sms.recipientOrSender.trim()
        val normalizedRecipient = com.malasakit.clinic.util.SMSFormatUtils.normalizePhoneNumber(rawRecipient)

        // Validate recipient phone number format
        if (!com.malasakit.clinic.util.SMSFormatUtils.isValidPhoneNumber(normalizedRecipient)) {
            Log.e(TAG, "Invalid recipient number format: '$rawRecipient' (local_id=${sms.localId})")
            failPermanently(
                sms = sms,
                errorCode = "INVALID_PHONE_NUMBER",
                errorMsg = "Invalid phone number format: $rawRecipient"
            )
            return
        }

        try {
            // Resolve SIM slot & active subscription
            val targetSlot = if (sms.simSlot >= 0) sms.simSlot else preferences.preferredSimSlot
            val simBinding = resolveSimBinding(targetSlot)

            val smsManager = simBinding.smsManager
            val parts = smsManager.divideMessage(sms.messageBody)
            val partsCount = parts.size

            val sentIntents = ArrayList<PendingIntent>()
            val deliveryIntents = ArrayList<PendingIntent>()

            for (i in 0 until partsCount) {
                // Sent intent (carrier network acceptance)
                val sentIntent = Intent(ACTION_SMS_SENT).apply {
                    setPackage(context.packageName)
                    putExtra(EXTRA_LOCAL_ID, sms.localId)
                    putExtra(EXTRA_REMOTE_ID, sms.remoteMessageId)
                    putExtra(EXTRA_PART_INDEX, i)
                    putExtra(EXTRA_TOTAL_PARTS, partsCount)
                }
                val sentPending = PendingIntent.getBroadcast(
                    context,
                    (sms.localId * 1000 + i).toInt(),
                    sentIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
                )
                sentIntents.add(sentPending)

                // Delivery intent (handset receipt)
                val deliveryIntent = Intent(ACTION_SMS_DELIVERED).apply {
                    setPackage(context.packageName)
                    putExtra(EXTRA_LOCAL_ID, sms.localId)
                    putExtra(EXTRA_REMOTE_ID, sms.remoteMessageId)
                    putExtra(EXTRA_PART_INDEX, i)
                    putExtra(EXTRA_TOTAL_PARTS, partsCount)
                }
                val delPending = PendingIntent.getBroadcast(
                    context,
                    (sms.localId * 1000 + i + 500).toInt(),
                    deliveryIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
                )
                deliveryIntents.add(delPending)
            }

            // Update status in local DB to SENDING and record SIM carrier metadata
            CoroutineScope(Dispatchers.IO).launch {
                smsDao.update(
                    sms.copy(
                        status = "SENDING",
                        simSlot = simBinding.slotIndex,
                        simCarrier = simBinding.carrierName,
                        partsCount = partsCount,
                        partsSent = 0,
                        partsDelivered = 0
                    )
                )
            }

            // Transmit via SmsManager
            if (partsCount > 1) {
                smsManager.sendMultipartTextMessage(
                    normalizedRecipient,
                    null,
                    parts,
                    sentIntents,
                    deliveryIntents
                )
            } else {
                smsManager.sendTextMessage(
                    normalizedRecipient,
                    null,
                    sms.messageBody,
                    sentIntents[0],
                    deliveryIntents[0]
                )
            }

            Log.i(TAG, "Transmitted SMS [id=${sms.localId}, remote=${sms.remoteMessageId}] via SIM ${simBinding.slotIndex} (${simBinding.carrierName}) to $normalizedRecipient (parts=$partsCount)")
        } catch (e: Exception) {
            Log.e(TAG, "Fatal error executing SmsManager dispatch", e)
            handleDispatchException(sms, e)
        }
    }

    private fun handleDispatchException(sms: SMSEntity, e: Exception) {
        val now = System.currentTimeMillis()
        val errorMsg = e.localizedMessage ?: "Unknown transmission error"

        if (sms.retryCount < MAX_RETRIES) {
            val nextRetry = sms.retryCount + 1
            val backoffMs = com.malasakit.clinic.util.SMSFormatUtils.calculateBackoff(nextRetry)
            Log.w(TAG, "Transient dispatch failure on SMS ${sms.localId}. Scheduling retry $nextRetry in ${backoffMs / 1000}s: $errorMsg")

            CoroutineScope(Dispatchers.IO).launch {
                smsDao.scheduleRetry(
                    localId = sms.localId,
                    newRetryCount = nextRetry,
                    nextAttemptMs = now + backoffMs,
                    errorMessage = errorMsg,
                    carrierCode = "EXCEPTION"
                )
            }
        } else {
            failPermanently(sms, "DISPATCH_EXCEPTION", errorMsg)
        }
    }

    private fun failPermanently(sms: SMSEntity, errorCode: String, errorMsg: String) {
        val now = System.currentTimeMillis()
        CoroutineScope(Dispatchers.IO).launch {
            smsDao.update(
                sms.copy(
                    status = "FAILED",
                    carrierErrorCode = errorCode,
                    errorMessage = errorMsg,
                    sentAt = now
                )
            )

            if (!sms.remoteMessageId.isNullOrBlank()) {
                repository.reportDelivery(
                    messageId = sms.remoteMessageId,
                    status = "FAILED",
                    carrierErrorCode = errorCode,
                    errorMessage = errorMsg,
                    sentAt = now
                )
            }
        }
    }

    /**
     * Resolves the appropriate SmsManager and SIM slot metadata.
     */
    private fun resolveSimBinding(preferredSlot: Int): SimBinding {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            val sims = DeviceHardwareHelper.detectSimCards(context)
            if (sims.isNotEmpty()) {
                val matched = sims.find { it.slotIndex == preferredSlot } ?: sims.first()

                val smsManager = if (matched.subscriptionId != -1) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        context.getSystemService(SmsManager::class.java).createForSubscriptionId(matched.subscriptionId)
                    } else {
                        @Suppress("DEPRECATION")
                        SmsManager.getSmsManagerForSubscriptionId(matched.subscriptionId)
                    }
                } else {
                    getDefaultSmsManager()
                }

                return SimBinding(
                    smsManager = smsManager,
                    slotIndex = matched.slotIndex,
                    carrierName = matched.carrierName,
                    subscriptionId = matched.subscriptionId
                )
            }
        }

        return SimBinding(
            smsManager = getDefaultSmsManager(),
            slotIndex = 0,
            carrierName = "Default SIM",
            subscriptionId = -1
        )
    }

    private fun getDefaultSmsManager(): SmsManager {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            context.getSystemService(SmsManager::class.java)
        } else {
            @Suppress("DEPRECATION")
            SmsManager.getDefault()
        }
    }

    data class SimBinding(
        val smsManager: SmsManager,
        val slotIndex: Int,
        val carrierName: String,
        val subscriptionId: Int
    )

    /**
     * BroadcastReceiver for carrier network acceptance callbacks (SMS_SENT).
     */
    class SMSSentReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val localId = intent.getLongExtra(EXTRA_LOCAL_ID, -1L)
            val remoteId = intent.getStringExtra(EXTRA_REMOTE_ID)
            val partIndex = intent.getIntExtra(EXTRA_PART_INDEX, 0)
            val totalParts = intent.getIntExtra(EXTRA_TOTAL_PARTS, 1)
            val resultCode = resultCode

            val db = AppDatabase.getInstance(context)
            val repo = GatewayRepository(context, AppPreferences(context), db)

            CoroutineScope(Dispatchers.IO).launch {
                val sms = if (localId != -1L) db.smsDao().getById(localId) else null
                if (sms == null) return@launch
                val now = System.currentTimeMillis()

                if (resultCode == Activity.RESULT_OK) {
                    val newPartsSent = sms.partsSent + 1
                    Log.i(TAG, "Carrier accepted part ${partIndex + 1}/$totalParts for SMS $localId")

                    if (newPartsSent >= totalParts) {
                        // All parts have been sent over the carrier network
                        db.smsDao().update(
                            sms.copy(
                                status = "SENT",
                                partsSent = newPartsSent,
                                sentAt = now,
                                errorMessage = null
                            )
                        )
                        Log.i(TAG, "SMS $localId fully SENT to carrier (parts=$totalParts)")
                    } else {
                        db.smsDao().update(sms.copy(partsSent = newPartsSent))
                    }
                } else {
                    // Carrier rejection / error
                    val carrierCode = resultCode.toString()
                    val errorMsg = com.malasakit.clinic.util.SMSFormatUtils.mapCarrierErrorCode(resultCode)
                    Log.w(TAG, "Carrier rejected part ${partIndex + 1}/$totalParts for SMS $localId (code=$resultCode: $errorMsg)")

                    val isTransient = com.malasakit.clinic.util.SMSFormatUtils.isTransientError(resultCode)
                    if (isTransient && sms.retryCount < MAX_RETRIES) {
                        val nextRetry = sms.retryCount + 1
                        val backoffMs = com.malasakit.clinic.util.SMSFormatUtils.calculateBackoff(nextRetry)
                        Log.w(TAG, "Transient carrier error. Rescheduling SMS $localId (attempt $nextRetry in ${backoffMs / 1000}s)")

                        db.smsDao().scheduleRetry(
                            localId = localId,
                            newRetryCount = nextRetry,
                            nextAttemptMs = now + backoffMs,
                            errorMessage = errorMsg,
                            carrierCode = carrierCode
                        )
                    } else {
                        // Permanent failure or retries exhausted
                        db.smsDao().update(
                            sms.copy(
                                status = "FAILED",
                                carrierErrorCode = carrierCode,
                                errorMessage = errorMsg,
                                sentAt = now
                            )
                        )

                        if (!remoteId.isNullOrBlank()) {
                            repo.reportDelivery(
                                messageId = remoteId,
                                status = "FAILED",
                                carrierErrorCode = carrierCode,
                                errorMessage = errorMsg,
                                sentAt = now
                            )
                        }
                    }
                }
            }
        }
    }

    /**
     * BroadcastReceiver for handset delivery receipts (SMS-STATUS-REPORT).
     */
    class SMSDeliveryReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val localId = intent.getLongExtra(EXTRA_LOCAL_ID, -1L)
            val remoteId = intent.getStringExtra(EXTRA_REMOTE_ID)
            val partIndex = intent.getIntExtra(EXTRA_PART_INDEX, 0)
            val totalParts = intent.getIntExtra(EXTRA_TOTAL_PARTS, 1)
            val isSuccess = resultCode == Activity.RESULT_OK

            val db = AppDatabase.getInstance(context)
            val repo = GatewayRepository(context, AppPreferences(context), db)

            CoroutineScope(Dispatchers.IO).launch {
                val sms = if (localId != -1L) db.smsDao().getById(localId) else null
                if (sms == null) return@launch
                val now = System.currentTimeMillis()

                if (isSuccess) {
                    val newPartsDelivered = sms.partsDelivered + 1
                    Log.i(TAG, "Recipient handset confirmed delivery of part ${partIndex + 1}/$totalParts for SMS $localId")

                    if (newPartsDelivered >= totalParts) {
                        db.smsDao().update(
                            sms.copy(
                                status = "DELIVERED",
                                partsDelivered = newPartsDelivered,
                                deliveredAt = now
                            )
                        )

                        if (!remoteId.isNullOrBlank()) {
                            repo.reportDelivery(
                                messageId = remoteId,
                                status = "DELIVERED",
                                deliveredAt = now
                            )
                        }
                    } else {
                        db.smsDao().update(sms.copy(partsDelivered = newPartsDelivered))
                    }
                } else {
                    Log.w(TAG, "Handset delivery failed for part ${partIndex + 1}/$totalParts for SMS $localId")
                    db.smsDao().update(
                        sms.copy(
                            status = "FAILED",
                            carrierErrorCode = "DELIVERY_REPORT_FAILED",
                            errorMessage = "Recipient handset reported delivery failure",
                            deliveredAt = now
                        )
                    )

                    if (!remoteId.isNullOrBlank()) {
                        repo.reportDelivery(
                            messageId = remoteId,
                            status = "FAILED",
                            carrierErrorCode = "DELIVERY_REPORT_FAILED",
                            errorMessage = "Recipient handset reported delivery failure",
                            deliveredAt = now
                        )
                    }
                }
            }
        }
    }

    companion object {
        private const val TAG = "SMSDispatcher"
        const val MAX_RETRIES = 3

        const val ACTION_SMS_SENT = "com.malasakit.clinic.SMS_SENT"
        const val ACTION_SMS_DELIVERED = "com.malasakit.clinic.SMS_DELIVERED"

        const val EXTRA_LOCAL_ID = "extra_local_id"
        const val EXTRA_REMOTE_ID = "extra_remote_id"
        const val EXTRA_PART_INDEX = "extra_part_index"
        const val EXTRA_TOTAL_PARTS = "extra_total_parts"
    }
}
