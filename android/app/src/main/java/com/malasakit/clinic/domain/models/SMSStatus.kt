package com.malasakit.clinic.domain.models

/**
 * Lifecycle status of an SMS message within Malasakit Gateway.
 */
enum class SMSStatus(val value: String) {
    QUEUED("QUEUED"),
    SENDING("SENDING"),
    SENT("SENT"),
    DELIVERED("DELIVERED"),
    FAILED("FAILED");

    companion object {
        fun fromValue(value: String): SMSStatus {
            return entries.find { it.value.equals(value, ignoreCase = true) } ?: QUEUED
        }
    }
}

/**
 * Message transmission direction.
 */
enum class SMSDirection(val value: String) {
    OUTBOUND("OUTBOUND"),
    INBOUND("INBOUND")
}

/**
 * Priority for dispatching outbound SMS.
 */
enum class SMSPriority(val value: String) {
    URGENT("URGENT"),
    HIGH("HIGH"),
    NORMAL("NORMAL"),
    LOW("LOW")
}
