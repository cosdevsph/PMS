package com.malasakit.clinic.data.api.models

import com.google.gson.annotations.SerializedName

/**
 * Body sent to POST /api/gateway/heartbeat/
 */
data class HeartbeatRequest(
    @SerializedName("battery_level")
    val batteryLevel: Int? = null,

    @SerializedName("is_charging")
    val isCharging: Boolean? = null,

    @SerializedName("network_type")
    val networkType: String? = null,

    @SerializedName("sim_carrier")
    val simCarrier: String? = null,

    @SerializedName("sim_carrier_2")
    val simCarrier2: String? = null,

    @SerializedName("app_version")
    val appVersion: String? = null
)

/**
 * Response from POST /api/gateway/heartbeat/
 */
data class HeartbeatResponse(
    @SerializedName("status")
    val status: String,

    @SerializedName("device_status")
    val deviceStatus: String? = "ACTIVE",

    @SerializedName("queue_count")
    val queueCount: Int = 0
)
