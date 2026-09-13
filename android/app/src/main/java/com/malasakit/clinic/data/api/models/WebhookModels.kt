package com.malasakit.clinic.data.api.models

import com.google.gson.annotations.SerializedName

/**
 * Report delivery or failure status to POST /api/gateway/webhook/delivery/
 */
data class DeliveryReportRequest(
    @SerializedName("message_id")
    val messageId: String,

    @SerializedName("status")
    val status: String, // "DELIVERED" or "FAILED"

    @SerializedName("carrier_error_code")
    val carrierErrorCode: String? = null,

    @SerializedName("error_message")
    val errorMessage: String? = null,

    @SerializedName("sent_at")
    val sentAt: String? = null,

    @SerializedName("delivered_at")
    val deliveredAt: String? = null
)

/**
 * Forward received inbound SMS to POST /api/gateway/webhooks/inbound/
 */
data class InboundSMSReportRequest(
    @SerializedName("message_id")
    val messageId: String,

    @SerializedName("sender")
    val sender: String,

    @SerializedName("recipient")
    val recipient: String? = null,

    @SerializedName("message")
    val message: String,

    @SerializedName("received_at")
    val receivedAt: String? = null,

    @SerializedName("sim_slot")
    val simSlot: Int = 0
)

/**
 * Generic response from webhooks and disconnect endpoints.
 */
data class GenericApiResponse(
    @SerializedName("status")
    val status: String,

    @SerializedName("error")
    val error: String? = null
)
