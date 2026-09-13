package com.malasakit.clinic.data.local.db

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * Local persistent representation of an SMS message handled by this gateway.
 */
@Entity(
    tableName = "sms_messages",
    indices = [
        Index(value = ["remote_message_id"], unique = false),
        Index(value = ["status", "next_attempt_at", "created_at"]),
        Index(value = ["direction", "created_at"])
    ]
)
data class SMSEntity(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "local_id")
    val localId: Long = 0L,

    @ColumnInfo(name = "remote_message_id")
    val remoteMessageId: String? = null,

    @ColumnInfo(name = "recipient_or_sender")
    val recipientOrSender: String,

    @ColumnInfo(name = "message_body")
    val messageBody: String,

    @ColumnInfo(name = "direction")
    val direction: String = "OUTBOUND", // OUTBOUND or INBOUND

    @ColumnInfo(name = "priority")
    val priority: String = "NORMAL",

    @ColumnInfo(name = "status")
    val status: String = "QUEUED", // QUEUED, SENDING, SENT, DELIVERED, FAILED

    @ColumnInfo(name = "sim_slot")
    val simSlot: Int = 0,

    @ColumnInfo(name = "sim_carrier")
    val simCarrier: String? = null,

    @ColumnInfo(name = "carrier_error_code")
    val carrierErrorCode: String? = null,

    @ColumnInfo(name = "error_message")
    val errorMessage: String? = null,

    @ColumnInfo(name = "parts_count")
    val partsCount: Int = 1,

    @ColumnInfo(name = "parts_sent")
    val partsSent: Int = 0,

    @ColumnInfo(name = "parts_delivered")
    val partsDelivered: Int = 0,

    @ColumnInfo(name = "retry_count")
    val retryCount: Int = 0,

    @ColumnInfo(name = "next_attempt_at")
    val nextAttemptAt: Long? = null,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "sent_at")
    val sentAt: Long? = null,

    @ColumnInfo(name = "delivered_at")
    val deliveredAt: Long? = null,

    @ColumnInfo(name = "reported_to_server")
    val reportedToServer: Boolean = false
)
