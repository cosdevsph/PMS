package com.malasakit.clinic.util

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.BatteryManager
import android.os.Build
import android.provider.Settings
import android.telephony.SubscriptionInfo
import android.telephony.SubscriptionManager
import android.telephony.TelephonyManager
import androidx.core.content.ContextCompat
import com.malasakit.clinic.domain.models.SIMInfo
import java.security.MessageDigest

/**
 * Utility helper extracting hardware state, battery level, network type, and SIM card details.
 * NOTE: Strictly accesses ONLY telephony and battery hardware - NEVER touches patient/device contacts.
 */
object DeviceHardwareHelper {

    /**
     * Gets stable hardware fingerprint hash for device registration deduplication.
     */
    @SuppressLint("HardwareIds")
    fun getDeviceFingerprint(context: Context): String {
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown_id"
        val raw = "${Build.MANUFACTURER}_${Build.MODEL}_${Build.BOARD}_${androidId}"
        return sha256(raw)
    }

    /**
     * Current battery percentage (0 to 100).
     */
    fun getBatteryLevel(context: Context): Int {
        val batteryIntent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        return if (batteryIntent != null) {
            val level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            if (level >= 0 && scale > 0) {
                ((level.toFloat() / scale.toFloat()) * 100).toInt()
            } else 100
        } else 100
    }

    /**
     * True if the device is plugged into AC, USB, or wireless charger.
     */
    fun isDeviceCharging(context: Context): Boolean {
        val batteryIntent = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
        if (batteryIntent != null) {
            val status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)
            return status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
        }
        return false
    }

    /**
     * Returns "WIFI", "CELLULAR", "ETHERNET", or "NONE".
     */
    fun getNetworkType(context: Context): String {
        val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return "NONE"
        val activeNetwork = cm.activeNetwork ?: return "NONE"
        val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return "NONE"

        return when {
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> "WIFI"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) -> "CELLULAR"
            capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET) -> "ETHERNET"
            else -> "UNKNOWN"
        }
    }

    /**
     * Detects inserted SIM cards via SubscriptionManager (requires READ_PHONE_STATE).
     * Falls back to TelephonyManager if dual-SIM API not available.
     */
    @SuppressLint("MissingPermission")
    fun detectSimCards(context: Context): List<SIMInfo> {
        val hasPhoneStatePermission = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED

        val results = mutableListOf<SIMInfo>()

        if (hasPhoneStatePermission && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            try {
                val subscriptionManager = context.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as? SubscriptionManager
                val activeList: List<SubscriptionInfo>? = subscriptionManager?.activeSubscriptionInfoList

                if (!activeList.isNullOrEmpty()) {
                    for (info in activeList) {
                        val carrier = info.carrierName?.toString()?.takeIf { it.isNotBlank() }
                            ?: info.displayName?.toString()?.takeIf { it.isNotBlank() }
                            ?: "Unknown Carrier"

                        results.add(
                            SIMInfo(
                                slotIndex = info.simSlotIndex,
                                carrierName = carrier,
                                displayName = info.displayName?.toString() ?: carrier,
                                countryIso = info.countryIso ?: "PH",
                                subscriptionId = info.subscriptionId,
                                isDefault = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                                    info.subscriptionId == SubscriptionManager.getDefaultSmsSubscriptionId()
                                } else false,
                                isDataRoaming = info.dataRoaming == SubscriptionManager.DATA_ROAMING_ENABLE
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                // Fallback to TelephonyManager below
            }
        }

        // Single SIM fallback if SubscriptionManager was empty or permission not yet granted
        if (results.isEmpty()) {
            val tm = context.getSystemService(Context.TELEPHONY_SERVICE) as? TelephonyManager
            val carrier = tm?.simOperatorName?.takeIf { it.isNotBlank() }
                ?: tm?.networkOperatorName?.takeIf { it.isNotBlank() }
                ?: "SIM 1"
            val country = tm?.simCountryIso?.takeIf { it.isNotBlank() } ?: "PH"

            results.add(
                SIMInfo(
                    slotIndex = 0,
                    carrierName = carrier,
                    displayName = carrier,
                    countryIso = country,
                    subscriptionId = -1,
                    isDefault = true
                )
            )
        }

        return results
    }

    private fun sha256(input: String): String {
        val md = MessageDigest.getInstance("SHA-256")
        val bytes = md.digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
