package com.malasakit.clinic.data.api.models

import com.google.gson.annotations.SerializedName

/**
 * Parsed payload from the Web Dashboard's QR code.
 * Example:
 * {
 *   "v": 1,
 *   "type": "malasakit_sms_pairing",
 *   "endpoint": "http://10.0.2.2:8000/api/gateway/devices/pair/",
 *   "token": "a1b2c3d4e5f6...",
 *   "code": "MAL-AB12",
 *   "clinic_id": 1,
 *   "clinic_name": "Malasakit Central Clinic"
 * }
 */
data class QRPairingPayload(
    @SerializedName("v")
    val version: Int = 1,

    @SerializedName("type")
    val type: String? = null,

    @SerializedName("endpoint")
    val endpoint: String? = null,

    @SerializedName("api")
    val apiLegacy: String? = null,

    @SerializedName("token")
    val token: String? = null,

    @SerializedName("code")
    val code: String? = null,

    @SerializedName("clinic_id")
    val clinicId: Long? = null,

    @SerializedName("cid")
    val clinicIdLegacy: Long? = null,

    @SerializedName("clinic_name")
    val clinicName: String? = null,

    @SerializedName("name")
    val clinicNameLegacy: String? = null,

    @SerializedName("exp")
    val expiresAtTimestamp: Long? = null
) {
    fun getEffectiveToken(): String? = token?.takeIf { it.isNotBlank() } ?: code?.takeIf { it.isNotBlank() }
    fun getEffectiveClinicName(): String = clinicName ?: clinicNameLegacy ?: "Malasakit Clinic"
    fun getEffectiveClinicId(): Long = clinicId ?: clinicIdLegacy ?: -1L
}

/**
 * Body sent to POST /api/gateway/devices/pair/
 * Matches DevicePairingRequestSerializer exactly.
 */
data class PairingRequest(
    @SerializedName("pairing_token")
    val pairingToken: String? = null,

    @SerializedName("pairing_code")
    val pairingCode: String? = null,

    @SerializedName("device_identifier")
    val deviceIdentifier: String,

    @SerializedName("device_name")
    val deviceName: String,

    @SerializedName("model_name")
    val modelName: String = "",

    @SerializedName("android_version")
    val androidVersion: String = "",

    @SerializedName("app_version")
    val appVersion: String = "1.0.0",

    @SerializedName("sim_carrier")
    val simCarrier: String? = null,

    @SerializedName("sim_slot_index")
    val simSlotIndex: Int? = null,

    @SerializedName("sim_subscription_id")
    val simSubscriptionId: Int? = null,

    @SerializedName("phone_number")
    val phoneNumber: String = "",

    @SerializedName("sms_capable")
    val smsCapable: Boolean = true
)

/**
 * Response from POST /api/gateway/devices/pair/
 */
data class PairingResponse(
    @SerializedName("success")
    val success: Boolean = false,

    @SerializedName("device_id")
    val deviceId: String? = null,

    @SerializedName("device_token")
    val deviceToken: String? = null,

    @SerializedName("device_identifier")
    val deviceIdentifier: String? = null,

    @SerializedName("clinic_id")
    val clinicId: Long? = null,

    @SerializedName("clinic_name")
    val clinicName: String? = null,

    @SerializedName("message")
    val message: String? = null,

    @SerializedName("error")
    val error: String? = null
)
