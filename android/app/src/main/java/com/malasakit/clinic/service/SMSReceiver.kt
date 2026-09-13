package com.malasakit.clinic.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.malasakit.clinic.MalasakitApp
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.local.db.AppDatabase
import com.malasakit.clinic.data.repository.GatewayRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Listens for incoming SMS messages received on the clinic phone's SIM card
 * and forwards them to the Malasakit web system.
 */
class SMSReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val preferences = AppPreferences(context)
        if (!preferences.isPaired) {
            Log.d(TAG, "Ignoring incoming SMS: Device is not paired to any clinic")
            return
        }

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        val sender = messages[0].originatingAddress ?: "Unknown"
        val fullBody = messages.joinToString("") { it.messageBody ?: "" }
        val timestamp = messages[0].timestampMillis

        // Detect SIM slot across standard Android and OEM vendor extras (Samsung, MediaTek, Xiaomi, Qualcomm)
        val simSlot = when {
            intent.hasExtra("slot") -> intent.getIntExtra("slot", 0)
            intent.hasExtra("simId") -> intent.getIntExtra("simId", 0)
            intent.hasExtra("simSlot") -> intent.getIntExtra("simSlot", 0)
            intent.hasExtra("android.telephony.extra.SLOT_INDEX") -> intent.getIntExtra("android.telephony.extra.SLOT_INDEX", 0)
            intent.hasExtra("phone") -> intent.getIntExtra("phone", 0)
            else -> preferences.preferredSimSlot
        }

        val messageId = java.util.UUID.randomUUID().toString()

        Log.i(TAG, "Inbound SMS received from $sender on SIM slot $simSlot (msgId=$messageId): $fullBody")

        val database = AppDatabase.getInstance(context)
        val repository = GatewayRepository(context, preferences, database)

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                repository.reportInboundSMS(
                    sender = sender,
                    message = fullBody,
                    simSlot = simSlot,
                    receivedAt = timestamp,
                    messageId = messageId
                )
            } catch (e: Exception) {
                Log.e(TAG, "Failed to report inbound SMS to server", e)
            } finally {
                pendingResult.finish()
            }
        }
    }

    companion object {
        private const val TAG = "SMSReceiver"
    }
}
