package com.malasakit.clinic.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.malasakit.clinic.MalasakitApp
import com.malasakit.clinic.R
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.local.db.AppDatabase
import com.malasakit.clinic.data.repository.GatewayRepository
import com.malasakit.clinic.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Foreground Service that continuously maintains connection to Malasakit Central,
 * polls outbound SMS queues, and dispatches messages via SIM hardware.
 */
class SMSGatewayService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + Job())
    private lateinit var preferences: AppPreferences
    private lateinit var database: AppDatabase
    private lateinit var repository: GatewayRepository
    private lateinit var dispatcher: SMSDispatcher

    private var wakeLock: PowerManager.WakeLock? = null
    private var isRunning = false

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "Creating SMSGatewayService")

        preferences = (application as MalasakitApp).preferences
        database = (application as MalasakitApp).database
        repository = GatewayRepository(this, preferences, database)
        dispatcher = SMSDispatcher(this)

        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MalasakitClinic::GatewayServiceWakeLock")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action
        if (action == ACTION_STOP_SERVICE) {
            stopForegroundService()
            return START_NOT_STICKY
        }

        if (!isRunning) {
            isRunning = true
            preferences.isServiceRunning = true

            startForegroundNotification()
            acquireWakeLock()
            startGatewayLoops()
        }

        return START_STICKY
    }

    private fun startForegroundNotification() {
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification: Notification = NotificationCompat.Builder(this, MalasakitApp.CHANNEL_SERVICE_ID)
            .setContentTitle(getString(R.string.service_running_title))
            .setContentText(preferences.clinicName ?: getString(R.string.service_running_desc))
            .setSmallIcon(R.drawable.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE or ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun startGatewayLoops() {
        // Loop 1: Queue Polling & Outbound Dispatch
        serviceScope.launch {
            while (isActive) {
                try {
                    if (preferences.isPaired) {
                        // 1. Fetch any newly enqueued messages from backend
                        repository.fetchPendingQueue()

                        // 2. Dispatch all local pending messages via SIM
                        val pendingOutbound = database.smsDao().getPendingOutbound()
                        for (sms in pendingOutbound) {
                            if (!isActive) break
                            dispatcher.dispatchMessage(sms)
                            // 1-second rate-limit throttle between outgoing messages to protect carrier quota
                            delay(1000)
                        }

                        // 3. Retry unreported webhooks
                        retryUnreportedEvents()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error in queue poll loop", e)
                }

                val interval = preferences.queuePollIntervalSeconds.coerceAtLeast(5) * 1000L
                delay(interval)
            }
        }

        // Loop 2: Telemetry Heartbeat
        serviceScope.launch {
            while (isActive) {
                try {
                    if (preferences.isPaired) {
                        val result = repository.sendHeartbeat()
                        result.onFailure { err ->
                            Log.w(TAG, "Heartbeat failed: ${err.message}")
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error in heartbeat loop", e)
                }

                val interval = preferences.heartbeatIntervalSeconds.coerceAtLeast(15) * 1000L
                delay(interval)
            }
        }
    }

    private suspend fun retryUnreportedEvents() {
        val unreportedDeliveries = database.smsDao().getUnreportedDeliveries()
        for (item in unreportedDeliveries) {
            val remoteId = item.remoteMessageId ?: continue
            repository.reportDelivery(
                messageId = remoteId,
                status = item.status,
                carrierErrorCode = item.carrierErrorCode,
                errorMessage = item.errorMessage,
                sentAt = item.sentAt,
                deliveredAt = item.deliveredAt
            )
        }

        val unreportedInbound = database.smsDao().getUnreportedInbound()
        for (inbound in unreportedInbound) {
            val msgId = inbound.remoteMessageId ?: java.util.UUID.randomUUID().toString()
            repository.reportInboundSMS(
                sender = inbound.recipientOrSender,
                message = inbound.messageBody,
                simSlot = inbound.simSlot,
                receivedAt = inbound.createdAt,
                messageId = msgId,
                existingLocalId = inbound.localId
            )
        }
    }

    private fun acquireWakeLock() {
        try {
            if (wakeLock?.isHeld == false) {
                wakeLock?.acquire(24 * 60 * 60 * 1000L) // 24-hr max safeguard
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to acquire wake lock", e)
        }
    }

    private fun releaseWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to release wake lock", e)
        }
    }

    private fun stopForegroundService() {
        isRunning = false
        preferences.isServiceRunning = false
        serviceScope.cancel()
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        stopForegroundService()
        super.onDestroy()
        Log.i(TAG, "Destroyed SMSGatewayService")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        private const val TAG = "SMSGatewayService"
        private const val NOTIFICATION_ID = 1001

        private const val ACTION_START_SERVICE = "com.malasakit.clinic.START_GATEWAY"
        private const val ACTION_STOP_SERVICE = "com.malasakit.clinic.STOP_GATEWAY"

        fun startService(context: Context) {
            val intent = Intent(context, SMSGatewayService::class.java).apply {
                action = ACTION_START_SERVICE
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopService(context: Context) {
            val intent = Intent(context, SMSGatewayService::class.java).apply {
                action = ACTION_STOP_SERVICE
            }
            context.startService(intent)
        }
    }
}
