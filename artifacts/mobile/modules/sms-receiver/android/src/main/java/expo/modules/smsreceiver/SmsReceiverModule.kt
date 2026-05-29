package expo.modules.smsreceiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.provider.Telephony
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SmsReceiverModule : Module() {
  private var receiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("SmsReceiver")
    Events("onSmsReceived")

    AsyncFunction("readRecentSms") { maxCount: Int ->
      val context = appContext.reactContext
        ?: return@AsyncFunction emptyList<Map<String, Any>>()
      val results = mutableListOf<Map<String, Any>>()
      val uri = Uri.parse("content://sms/inbox")
      val projection = arrayOf("_id", "address", "body", "date")
      val cutoff = System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000
      val cursor: Cursor? = try {
        context.contentResolver.query(
          uri, projection,
          "date > ?", arrayOf(cutoff.toString()),
          "date DESC"
        )
      } catch (e: Exception) {
        null
      }
      cursor?.use {
        val idIdx = it.getColumnIndexOrThrow("_id")
        val addrIdx = it.getColumnIndexOrThrow("address")
        val bodyIdx = it.getColumnIndexOrThrow("body")
        val dateIdx = it.getColumnIndexOrThrow("date")
        var count = 0
        while (it.moveToNext() && count < maxCount) {
          results.add(
            mapOf(
              "id" to it.getString(idIdx),
              "address" to (it.getString(addrIdx) ?: ""),
              "body" to (it.getString(bodyIdx) ?: ""),
              "date" to it.getLong(dateIdx)
            )
          )
          count++
        }
      }
      results
    }

    Function("startListening") {
      val context = appContext.reactContext ?: return@Function
      if (receiver != null) return@Function

      receiver = object : BroadcastReceiver() {
        override fun onReceive(ctx: Context, intent: Intent) {
          if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
          val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            ?: return
          if (messages.isEmpty()) return
          val address = messages[0].originatingAddress ?: ""
          val body = messages.joinToString("") { it.messageBody ?: "" }
          sendEvent(
            "onSmsReceived", mapOf(
              "address" to address,
              "body" to body,
              "date" to System.currentTimeMillis()
            )
          )
        }
      }

      val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION).apply {
        priority = 999
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
      } else {
        @Suppress("UnspecifiedRegisterReceiverFlag")
        context.registerReceiver(receiver, filter)
      }
    }

    Function("stopListening") {
      unregisterReceiver()
    }

    OnDestroy {
      unregisterReceiver()
    }
  }

  private fun unregisterReceiver() {
    val context = appContext.reactContext ?: return
    receiver?.let {
      try {
        context.unregisterReceiver(it)
      } catch (_: Exception) {}
      receiver = null
    }
  }
}
