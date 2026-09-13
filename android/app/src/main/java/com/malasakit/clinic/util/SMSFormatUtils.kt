package com.malasakit.clinic.util

import android.telephony.SmsManager
import java.util.regex.Pattern

/**
 * Utility functions for SMS phone normalization, validation, carrier error mapping,
 * and retry backoff calculations.
 */
object SMSFormatUtils {

    private val PHONE_PATTERN = Pattern.compile("^\\+?[0-9]{8,15}\$")

    /**
     * Cleans spaces, dashes, and formats local Philippine or international numbers into standard E.164.
     */
    fun normalizePhoneNumber(raw: String): String {
        var clean = raw.replace(Regex("[\\s\\-\\(\\)]"), "")
        if (clean.startsWith("09") && clean.length == 11) {
            clean = "+63" + clean.substring(1)
        } else if (clean.startsWith("9") && clean.length == 10) {
            clean = "+63$clean"
        }
        return clean
    }

    /**
     * Checks if the phone number is valid E.164 or dialable mobile number.
     */
    fun isValidPhoneNumber(number: String): Boolean {
        return PHONE_PATTERN.matcher(number).matches()
    }

    /**
     * Calculates exponential backoff in milliseconds:
     * Retry 1: 15s (15,000ms)
     * Retry 2: 30s (30,000ms)
     * Retry 3: 60s (60,000ms)
     */
    fun calculateBackoff(retryIndex: Int): Long {
        if (retryIndex <= 0) return 0L
        return 15_000L * (1 shl (retryIndex - 1)).coerceAtMost(4)
    }

    /**
     * Determines whether a carrier error code is transient (recoverable via retry).
     */
    fun isTransientError(code: Int): Boolean {
        return when (code) {
            SmsManager.RESULT_ERROR_NO_SERVICE,
            SmsManager.RESULT_ERROR_RADIO_OFF,
            SmsManager.RESULT_ERROR_LIMIT_EXCEEDED -> true
            else -> false
        }
    }

    /**
     * Human-readable mapping of native Android SmsManager error codes.
     */
    fun mapCarrierErrorCode(code: Int): String {
        return when (code) {
            SmsManager.RESULT_ERROR_GENERIC_FAILURE -> "Generic carrier failure (Check SIM balance / prepaid load)"
            SmsManager.RESULT_ERROR_RADIO_OFF -> "Cellular radio disabled (Airplane mode)"
            SmsManager.RESULT_ERROR_NULL_PDU -> "Null PDU generation failure"
            SmsManager.RESULT_ERROR_NO_SERVICE -> "No cellular network coverage"
            SmsManager.RESULT_ERROR_LIMIT_EXCEEDED -> "Carrier dispatch rate limit exceeded"
            else -> "Carrier Error Code: $code"
        }
    }
}
