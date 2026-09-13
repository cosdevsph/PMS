package com.malasakit.clinic.data.api.models

import com.google.gson.annotations.SerializedName

/**
 * Message payload received when claiming messages from GET /api/gateway/queue/
 */
data class OutboundSMSItem(
    @SerializedName("id")
    val id: String,

    @SerializedName("recipient")
    val recipient: String,

    @SerializedName("message")
    val message: String,

    @SerializedName("priority")
    val priority: String = "NORMAL",

    @SerializedName("sim_slot")
    val simSlot: Int = 0
)

/**
 * Queue claim response from GET /api/gateway/queue/
 */
data class QueueClaimResponse(
    @SerializedName("messages")
    val messages: List<OutboundSMSItem> = emptyList()
)
