package com.malasakit.clinic.util

import android.telephony.SmsManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SMSFormatUtilsTest {

    @Test
    fun testNormalizePhoneNumber() {
        // Standard PH mobile starting with 09
        assertEquals("+639171234567", SMSFormatUtils.normalizePhoneNumber("09171234567"))

        // 10-digit without leading 0
        assertEquals("+639171234567", SMSFormatUtils.normalizePhoneNumber("9171234567"))

        // Formatted with spaces and hyphens
        assertEquals("+639171234567", SMSFormatUtils.normalizePhoneNumber("+63 917-123-4567"))
        assertEquals("+639171234567", SMSFormatUtils.normalizePhoneNumber("(0917) 123-4567"))

        // Standard international format preserved
        assertEquals("+14155552671", SMSFormatUtils.normalizePhoneNumber("+1 (415) 555-2671"))
    }

    @Test
    fun testIsValidPhoneNumber() {
        // Valid numbers
        assertTrue(SMSFormatUtils.isValidPhoneNumber("+639171234567"))
        assertTrue(SMSFormatUtils.isValidPhoneNumber("09171234567"))
        assertTrue(SMSFormatUtils.isValidPhoneNumber("+14155552671"))

        // Invalid numbers
        assertFalse(SMSFormatUtils.isValidPhoneNumber("123"))
        assertFalse(SMSFormatUtils.isValidPhoneNumber("abc"))
        assertFalse(SMSFormatUtils.isValidPhoneNumber("phone-number"))
        assertFalse(SMSFormatUtils.isValidPhoneNumber(""))
    }

    @Test
    fun testCalculateBackoff() {
        // Retry 1: 15 seconds
        assertEquals(15000L, SMSFormatUtils.calculateBackoff(1))

        // Retry 2: 30 seconds
        assertEquals(30000L, SMSFormatUtils.calculateBackoff(2))

        // Retry 3: 60 seconds (capped)
        assertEquals(60000L, SMSFormatUtils.calculateBackoff(3))

        // Retry 0 or negative
        assertEquals(0L, SMSFormatUtils.calculateBackoff(0))
    }

    @Test
    fun testCarrierErrorClassification() {
        // Transient errors (retryable)
        assertTrue(SMSFormatUtils.isTransientError(SmsManager.RESULT_ERROR_NO_SERVICE))
        assertTrue(SMSFormatUtils.isTransientError(SmsManager.RESULT_ERROR_RADIO_OFF))
        assertTrue(SMSFormatUtils.isTransientError(SmsManager.RESULT_ERROR_LIMIT_EXCEEDED))

        // Permanent / non-transient errors
        assertFalse(SMSFormatUtils.isTransientError(SmsManager.RESULT_ERROR_GENERIC_FAILURE))
        assertFalse(SMSFormatUtils.isTransientError(SmsManager.RESULT_ERROR_NULL_PDU))
    }

    @Test
    fun testMapCarrierErrorCode() {
        val genericMsg = SMSFormatUtils.mapCarrierErrorCode(SmsManager.RESULT_ERROR_GENERIC_FAILURE)
        assertTrue(genericMsg.contains("Check SIM balance", ignoreCase = true))

        val radioMsg = SMSFormatUtils.mapCarrierErrorCode(SmsManager.RESULT_ERROR_RADIO_OFF)
        assertTrue(radioMsg.contains("Airplane mode", ignoreCase = true))

        val noServiceMsg = SMSFormatUtils.mapCarrierErrorCode(SmsManager.RESULT_ERROR_NO_SERVICE)
        assertTrue(noServiceMsg.contains("No cellular network", ignoreCase = true))
    }
}
