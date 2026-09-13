package com.malasakit.clinic.domain.models

/**
 * Operational state and telemetry of the Malasakit Clinic Gateway device.
 */
data class DeviceState(
    val isPaired: Boolean = false,
    val deviceId: String? = null,
    val deviceName: String = "",
    val clinicId: Long? = null,
    val clinicName: String? = null,
    val serverUrl: String = "",
    val status: GatewayStatus = GatewayStatus.UNPAIRED,
    val batteryLevel: Int = 100,
    val isCharging: Boolean = false,
    val networkType: String = "UNKNOWN",
    val simCards: List<SIMInfo> = emptyList(),
    val queuedMessagesCount: Int = 0,
    val sentTodayCount: Int = 0,
    val failedTodayCount: Int = 0,
    val lastHeartbeatTimestamp: Long = 0L,
    val lastSyncTimestamp: Long = 0L,
    val lastErrorMessage: String? = null
)

enum class GatewayStatus(val label: String) {
    UNPAIRED("Unpaired"),
    CONNECTING("Connecting"),
    ONLINE("Active & Listening"),
    DISPATCHING("Sending Messages"),
    OFFLINE("Offline"),
    SUSPENDED("Suspended by Clinic"),
    ERROR("Service Error")
}
