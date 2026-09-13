package com.malasakit.clinic.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.malasakit.clinic.data.local.AppPreferences

/**
 * Automatically resumes the SMS Gateway Foreground Service when device boots up or app updates.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.i(TAG, "Received broadcast action: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            val prefs = AppPreferences(context)
            if (prefs.isPaired && prefs.autoStartOnBoot) {
                Log.i(TAG, "Auto-starting SMSGatewayService after boot/package update")
                SMSGatewayService.startService(context)
            } else {
                Log.d(TAG, "Skipping auto-start (isPaired=${prefs.isPaired}, autoStart=${prefs.autoStartOnBoot})")
            }
        }
    }

    companion object {
        private const val TAG = "BootReceiver"
    }
}
