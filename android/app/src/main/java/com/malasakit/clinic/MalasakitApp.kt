package com.malasakit.clinic

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.malasakit.clinic.data.api.GatewayApiService
import com.malasakit.clinic.data.api.NetworkClient
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.local.db.AppDatabase

class MalasakitApp : Application() {

    lateinit var preferences: AppPreferences
        private set

    lateinit var database: AppDatabase
        private set

    val apiService: GatewayApiService
        get() = NetworkClient.getApiService(this)

    override fun onCreate() {
        super.onCreate()
        instance = this
        preferences = AppPreferences(this)
        database = AppDatabase.getInstance(this)

        createNotificationChannels()

        if (preferences.isPaired) {
            com.malasakit.clinic.service.HeartbeatWorker.schedule(this)
        }
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            // Foreground service channel (low prominence / silent persistent notification)
            val serviceChannel = NotificationChannel(
                CHANNEL_SERVICE_ID,
                getString(R.string.notification_channel_service),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_service_desc)
                setShowBadge(false)
            }

            // Alert channel for errors or critical disconnects
            val alertChannel = NotificationChannel(
                CHANNEL_ALERTS_ID,
                getString(R.string.notification_channel_alerts),
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = getString(R.string.notification_channel_alerts_desc)
                enableVibration(true)
            }

            notificationManager.createNotificationChannel(serviceChannel)
            notificationManager.createNotificationChannel(alertChannel)
        }
    }

    companion object {
        const val CHANNEL_SERVICE_ID = "malasakit_gateway_service_channel"
        const val CHANNEL_ALERTS_ID = "malasakit_gateway_alerts_channel"

        lateinit var instance: MalasakitApp
            private set
    }
}
