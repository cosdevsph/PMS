package com.malasakit.clinic.domain.models

/**
 * Represents SIM card detection information from Telephony / SubscriptionManager.
 */
data class SIMInfo(
    val slotIndex: Int,
    val carrierName: String,
    val displayName: String,
    val countryIso: String,
    val subscriptionId: Int,
    val isDefault: Boolean = false,
    val isDataRoaming: Boolean = false
)
