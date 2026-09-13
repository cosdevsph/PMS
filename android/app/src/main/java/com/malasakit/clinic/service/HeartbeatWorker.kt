package com.malasakit.clinic.service

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.malasakit.clinic.MalasakitApp
import com.malasakit.clinic.data.repository.GatewayRepository
import java.util.concurrent.TimeUnit

/**
 * OS-level periodic watchdog worker managed by Android WorkManager.
 * 
 * Ensures high reliability by:
 * 1. Transmitting telemetry heartbeat even if foreground service is suspended by aggressive OS power management.
 * 2. Monitoring whether SMSGatewayService is running; if not, automatically re-initiating foreground service.
 */
class HeartbeatWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val app = applicationContext as? MalasakitApp ?: return Result.failure()
        val preferences = app.preferences

        if (!preferences.isPaired) {
            Log.d(TAG, "Device is not paired — skipping watchdog heartbeat")
            return Result.success()
        }

        return try {
            val repository = GatewayRepository(applicationContext, preferences, app.database)
            val result = repository.sendHeartbeat()

            result.onSuccess { response ->
                Log.i(TAG, "Watchdog heartbeat successful (status=${response.deviceStatus}, queue=${response.queueCount})")
            }.onFailure { error ->
                Log.w(TAG, "Watchdog heartbeat failed: ${error.message}")
            }

            // Watchdog: re-launch SMSGatewayService if terminated
            if (!preferences.isServiceRunning && preferences.isPaired) {
                Log.i(TAG, "Watchdog detected SMSGatewayService stopped. Re-awakening foreground service...")
                SMSGatewayService.startService(applicationContext)
            }

            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Exception in HeartbeatWorker", e)
            Result.retry()
        }
    }

    companion object {
        private const val TAG = "HeartbeatWorker"
        private const val UNIQUE_WORK_NAME = "malasakit_gateway_heartbeat_worker"

        /**
         * Schedules the periodic WorkManager watchdog (runs every 15 minutes with network constraints).
         */
        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()

            val workRequest = PeriodicWorkRequestBuilder<HeartbeatWorker>(
                15, TimeUnit.MINUTES,
                5, TimeUnit.MINUTES
            ).setConstraints(constraints).build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                workRequest
            )
            Log.i(TAG, "Enqueued periodic watchdog HeartbeatWorker")
        }

        /**
         * Cancels periodic watchdog when device is intentionally unpaired.
         */
        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_WORK_NAME)
            Log.i(TAG, "Cancelled watchdog HeartbeatWorker")
        }
    }
}
