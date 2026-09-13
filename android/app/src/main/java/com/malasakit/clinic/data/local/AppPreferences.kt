package com.malasakit.clinic.data.local

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure encrypted preferences store for Malasakit Clinic Gateway credentials and config.
 */
class AppPreferences(context: Context) {

    private val prefs: SharedPreferences

    init {
        prefs = try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            EncryptedSharedPreferences.create(
                context,
                PREFS_FILENAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            Log.w(TAG, "EncryptedSharedPreferences initialization failed, falling back to standard prefs", e)
            context.getSharedPreferences("${PREFS_FILENAME}_fallback", Context.MODE_PRIVATE)
        }
    }

    var serverUrl: String
        get() = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER_URL) ?: DEFAULT_SERVER_URL
        set(value) = prefs.edit().putString(KEY_SERVER_URL, sanitizeUrl(value)).apply()

    var deviceToken: String?
        get() = prefs.getString(KEY_DEVICE_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_TOKEN, value).apply()

    var deviceId: String?
        get() = prefs.getString(KEY_DEVICE_ID, null)
        set(value) = prefs.edit().putString(KEY_DEVICE_ID, value).apply()

    var deviceName: String
        get() = prefs.getString(KEY_DEVICE_NAME, "") ?: ""
        set(value) = prefs.edit().putString(KEY_DEVICE_NAME, value).apply()

    var clinicId: Long
        get() = prefs.getLong(KEY_CLINIC_ID, -1L)
        set(value) = prefs.edit().putLong(KEY_CLINIC_ID, value).apply()

    var clinicName: String?
        get() = prefs.getString(KEY_CLINIC_NAME, null)
        set(value) = prefs.edit().putString(KEY_CLINIC_NAME, value).apply()

    var isPaired: Boolean
        get() = prefs.getBoolean(KEY_IS_PAIRED, false) && !deviceToken.isNullOrBlank()
        set(value) = prefs.edit().putBoolean(KEY_IS_PAIRED, value).apply()

    var preferredSimSlot: Int
        get() = prefs.getInt(KEY_PREFERRED_SIM_SLOT, 0)
        set(value) = prefs.edit().putInt(KEY_PREFERRED_SIM_SLOT, value).apply()

    var simPhoneNumber: String?
        get() = prefs.getString(KEY_SIM_PHONE_NUMBER, null)
        set(value) = prefs.edit().putString(KEY_SIM_PHONE_NUMBER, value).apply()

    var simCarrier: String?
        get() = prefs.getString(KEY_SIM_CARRIER, null)
        set(value) = prefs.edit().putString(KEY_SIM_CARRIER, value).apply()

    var heartbeatIntervalSeconds: Int
        get() = prefs.getInt(KEY_HEARTBEAT_INTERVAL, 30)
        set(value) = prefs.edit().putInt(KEY_HEARTBEAT_INTERVAL, value).apply()

    var queuePollIntervalSeconds: Int
        get() = prefs.getInt(KEY_POLL_INTERVAL, 10)
        set(value) = prefs.edit().putInt(KEY_POLL_INTERVAL, value).apply()

    var autoStartOnBoot: Boolean
        get() = prefs.getBoolean(KEY_AUTO_START_BOOT, true)
        set(value) = prefs.edit().putBoolean(KEY_AUTO_START_BOOT, value).apply()

    var isServiceRunning: Boolean
        get() = prefs.getBoolean(KEY_SERVICE_RUNNING, false)
        set(value) = prefs.edit().putBoolean(KEY_SERVICE_RUNNING, value).apply()

    /**
     * Resets device pairing credentials upon disconnect.
     */
    fun clearPairing() {
        prefs.edit()
            .remove(KEY_DEVICE_TOKEN)
            .remove(KEY_DEVICE_ID)
            .remove(KEY_CLINIC_ID)
            .remove(KEY_CLINIC_NAME)
            .remove(KEY_SIM_PHONE_NUMBER)
            .remove(KEY_SIM_CARRIER)
            .putBoolean(KEY_IS_PAIRED, false)
            .apply()
    }

    /**
     * Clears all settings and credentials.
     */
    fun clearAll() {
        prefs.edit().clear().apply()
    }

    private fun sanitizeUrl(raw: String): String {
        var clean = raw.trim()
        if (clean.contains("malasakit.webservice.onrender.com")) {
            clean = clean.replace("malasakit.webservice.onrender.com", "malasakit-webservice.onrender.com")
        }
        val isLocalhost = clean.contains("10.0.2.2") ||
                clean.contains("127.0.0.1") ||
                clean.contains("localhost") ||
                clean.startsWith("192.168.") ||
                clean.startsWith("http://192.168.")

        // Automatically upgrade remote/cloud hosts to https://
        if (clean.startsWith("http://") && !isLocalhost) {
            clean = "https://" + clean.removePrefix("http://")
        } else if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
            clean = if (isLocalhost) "http://$clean" else "https://$clean"
        }

        // If user typed domain without /api, ensure /api/ is appended
        if (!clean.contains("/api")) {
            clean = clean.trimEnd('/') + "/api/"
        }

        if (!clean.endsWith("/")) {
            clean = "$clean/"
        }
        return clean
    }

    companion object {
        private const val TAG = "AppPreferences"
        private const val PREFS_FILENAME = "malasakit_clinic_secure_prefs"

        const val DEFAULT_SERVER_URL = "https://malasakit-webservice.onrender.com/api/"

        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_DEVICE_NAME = "device_name"
        private const val KEY_CLINIC_ID = "clinic_id"
        private const val KEY_CLINIC_NAME = "clinic_name"
        private const val KEY_IS_PAIRED = "is_paired"
        private const val KEY_PREFERRED_SIM_SLOT = "preferred_sim_slot"
        private const val KEY_SIM_PHONE_NUMBER = "sim_phone_number"
        private const val KEY_SIM_CARRIER = "sim_carrier"
        private const val KEY_HEARTBEAT_INTERVAL = "heartbeat_interval"
        private const val KEY_POLL_INTERVAL = "poll_interval"
        private const val KEY_AUTO_START_BOOT = "auto_start_boot"
        private const val KEY_SERVICE_RUNNING = "service_running"
    }
}
