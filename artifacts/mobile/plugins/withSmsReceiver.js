const { withMainApplication, withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const KOTLIN_DIR = "app/src/main/java/expo/modules/smsreceiver";

const SMS_RECEIVER_MODULE_KT = `package expo.modules.smsreceiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.provider.Telephony
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiverModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private var receiver: BroadcastReceiver? = null

    override fun getName() = "SmsReceiver"

    @ReactMethod
    fun startListening() {
        if (receiver != null) return
        receiver = object : BroadcastReceiver() {
            override fun onReceive(ctx: Context, intent: Intent) {
                if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
                val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent) ?: return
                if (messages.isEmpty()) return
                val address = messages[0].originatingAddress ?: ""
                val body = messages.joinToString("") { it.messageBody ?: "" }
                val params = Arguments.createMap().apply {
                    putString("address", address)
                    putString("body", body)
                    putDouble("date", System.currentTimeMillis().toDouble())
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("SmsReceived", params)
            }
        }
        val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION).apply {
            priority = 999
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            reactContext.registerReceiver(receiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("UnspecifiedRegisterReceiverFlag")
            reactContext.registerReceiver(receiver, filter)
        }
    }

    @ReactMethod
    fun stopListening() {
        receiver?.let {
            try { reactContext.unregisterReceiver(it) } catch (_: Exception) {}
            receiver = null
        }
    }

    @ReactMethod
    fun readRecentSms(maxCount: Int, promise: Promise) {
        try {
            val results = Arguments.createArray()
            val uri = Uri.parse("content://sms/inbox")
            val projection = arrayOf("_id", "address", "body", "date")
            val cutoff = System.currentTimeMillis() - 7L * 24 * 60 * 60 * 1000
            val cursor = reactContext.contentResolver.query(
                uri, projection,
                "date > ?", arrayOf(cutoff.toString()),
                "date DESC"
            )
            cursor?.use {
                val idIdx = it.getColumnIndexOrThrow("_id")
                val addrIdx = it.getColumnIndexOrThrow("address")
                val bodyIdx = it.getColumnIndexOrThrow("body")
                val dateIdx = it.getColumnIndexOrThrow("date")
                var count = 0
                while (it.moveToNext() && count < maxCount) {
                    val item = Arguments.createMap().apply {
                        putString("id", it.getString(idIdx))
                        putString("address", it.getString(addrIdx) ?: "")
                        putString("body", it.getString(bodyIdx) ?: "")
                        putDouble("date", it.getLong(dateIdx).toDouble())
                    }
                    results.pushMap(item)
                    count++
                }
            }
            promise.resolve(results)
        } catch (e: Exception) {
            promise.reject("SMS_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
`;

const SMS_RECEIVER_PACKAGE_KT = `package expo.modules.smsreceiver

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class SmsReceiverPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(SmsReceiverModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
`;

function withSmsReceiverFiles(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const dir = path.join(
        config.modRequest.platformProjectRoot,
        KOTLIN_DIR
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "SmsReceiverModule.kt"),
        SMS_RECEIVER_MODULE_KT
      );
      fs.writeFileSync(
        path.join(dir, "SmsReceiverPackage.kt"),
        SMS_RECEIVER_PACKAGE_KT
      );
      return config;
    },
  ]);
}

function withSmsReceiverRegistration(config) {
  return withMainApplication(config, (config) => {
    const content = config.modResults.contents;
    if (content.includes("SmsReceiverPackage")) return config;

    let updated = content.replace(
      "import expo.modules.ReactNativeHostWrapper",
      "import expo.modules.ReactNativeHostWrapper\nimport expo.modules.smsreceiver.SmsReceiverPackage"
    );

    updated = updated.replace(
      /val packages = PackageList\(this\)\.packages/,
      "val packages = PackageList(this).packages\n          packages.add(SmsReceiverPackage())"
    );

    config.modResults.contents = updated;
    return config;
  });
}

module.exports = function withSmsReceiver(config) {
  config = withSmsReceiverFiles(config);
  config = withSmsReceiverRegistration(config);
  return config;
};
