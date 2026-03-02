/**
 * Expo Config Plugin — Real-time bank/UPI Notification Listener
 *
 * Injects into the Android build:
 *  • TransactionNotificationService  (NotificationListenerService)
 *  • NotificationListenerModule      (React Native bridge module)
 *  • NotificationListenerPackage     (RN package registrar)
 *
 * Then registers everything in AndroidManifest.xml + MainApplication.kt
 */

const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// ─── Java source files ────────────────────────────────────────────────────────

const TRANSACTION_SERVICE = `package com.moniqofi.app;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TransactionNotificationService extends NotificationListenerService {

    private static final String PREFS_NAME = "MoniqoFiTx";
    private static final String PREFS_KEY  = "pending";

    private static final Pattern AMT_PAT = Pattern.compile(
        "(?:Rs\\\\.?|INR|\\u20B9)\\\\s*([\\\\d,]+(?:\\\\.\\\\d{1,2})?)",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern DEBIT_PAT = Pattern.compile(
        "debited|deducted|paid|sent|payment|spent|withdrawn|debit",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern CREDIT_PAT = Pattern.compile(
        "credited|received|added|refund|deposited|credit",
        Pattern.CASE_INSENSITIVE
    );

    private static final String[] WATCH_PKG = {
        "com.google.android.apps.nbu.paisa.user",
        "com.phonepe.app",
        "net.one97.paytm",
        "in.org.npci.upiapp",
        "com.sbi.lotusintouch",
        "com.sbi.SBIFreedomPlus",
        "com.snapwork.hdfc",
        "com.hdfc.mobilebanking",
        "com.csam.icici.bank.imobile",
        "com.axis.mobile",
        "com.msf.kbank.mobile",
        "com.amazon.mShop.android.shopping",
        "com.samsung.android.spay",
        "com.mcom.bobworld",
        "com.pnb.mbanking",
        "com.canarabank.mobility",
        "com.freecharge.android",
        "com.dreamplug.androidapp",
        "com.mobikwik_new",
        "com.airtel.money",
    };

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String pkg = sbn.getPackageName();
        Notification n = sbn.getNotification();
        if (n == null) return;

        Bundle extras = n.extras;
        String title = extras != null ? extras.getString(Notification.EXTRA_TITLE, "") : "";
        String body  = extras != null ? extras.getString(Notification.EXTRA_TEXT,  "") : "";
        String full  = title + " " + body;

        boolean isBankApp = false;
        for (String p : WATCH_PKG) {
            if (p.equals(pkg)) { isBankApp = true; break; }
        }

        boolean hasAmt    = full.contains("\\u20B9") || full.toLowerCase().contains("rs.") ||
                            full.toLowerCase().contains("inr");
        boolean hasTxWord = DEBIT_PAT.matcher(full).find() || CREDIT_PAT.matcher(full).find();

        if (!isBankApp && !(hasAmt && hasTxWord)) return;

        try {
            JSONObject tx = parseTransaction(full, pkg, title);
            if (tx != null) {
                saveTx(tx);
                broadcast(tx);
            }
        } catch (Exception ignored) {}
    }

    private JSONObject parseTransaction(String text, String pkg, String title) throws Exception {
        Matcher m = AMT_PAT.matcher(text);
        if (!m.find()) return null;

        double amt;
        try {
            amt = Double.parseDouble(m.group(1).replace(",", ""));
        } catch (NumberFormatException e) {
            return null;
        }
        if (amt <= 0) return null;

        boolean isCredit = CREDIT_PAT.matcher(text).find();

        JSONObject tx = new JSONObject();
        tx.put("amount",      amt);
        tx.put("type",        isCredit ? "income" : "expense");
        tx.put("title",       title.isEmpty() ? (isCredit ? "Money Received" : "Payment") : title);
        tx.put("description", text.length() > 120 ? text.substring(0, 120) : text);
        tx.put("source",      appLabel(pkg));
        tx.put("category",    guessCategory(text));
        tx.put("timestamp",   System.currentTimeMillis());
        return tx;
    }

    private String appLabel(String pkg) {
        if (pkg.contains("phonepe"))  return "PhonePe";
        if (pkg.contains("paisa"))    return "Google Pay";
        if (pkg.contains("paytm"))    return "Paytm";
        if (pkg.contains("sbi"))      return "SBI";
        if (pkg.contains("hdfc"))     return "HDFC";
        if (pkg.contains("icici"))    return "ICICI";
        if (pkg.contains("axis"))     return "Axis";
        if (pkg.contains("kbank"))    return "Kotak";
        if (pkg.contains("amazon"))   return "Amazon Pay";
        if (pkg.contains("npci") || pkg.contains("bhim")) return "BHIM UPI";
        if (pkg.contains("freecharge")) return "FreeCharge";
        if (pkg.contains("cred"))     return "CRED";
        if (pkg.contains("mobikwik")) return "MobiKwik";
        return "Bank";
    }

    private String guessCategory(String t) {
        String s = t.toLowerCase();
        if (s.contains("zomato") || s.contains("swiggy") || s.contains("food")
            || s.contains("restaurant") || s.contains("cafe"))   return "Food & Dining";
        if (s.contains("amazon") || s.contains("flipkart")
            || s.contains("myntra") || s.contains("shopping"))   return "Shopping";
        if (s.contains("ola") || s.contains("uber") || s.contains("rapido")
            || s.contains("irctc") || s.contains("flight") || s.contains("travel")) return "Travel";
        if (s.contains("netflix") || s.contains("spotify")
            || s.contains("hotstar") || s.contains("prime"))     return "Subscriptions";
        if (s.contains("electricity") || s.contains("water") || s.contains("gas")
            || s.contains("broadband") || s.contains("recharge")) return "Utilities";
        if (s.contains("hospital") || s.contains("pharmacy")
            || s.contains("medical") || s.contains("doctor"))    return "Health";
        if (s.contains("rent") || s.contains("maintenance"))     return "Housing";
        if (s.contains("salary") || s.contains("payroll"))       return "Income";
        return "Other";
    }

    private void saveTx(JSONObject tx) {
        try {
            SharedPreferences p = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String raw = p.getString(PREFS_KEY, "[]");
            JSONArray arr = new JSONArray(raw);
            arr.put(tx);
            if (arr.length() > 200) {
                JSONArray trimmed = new JSONArray();
                for (int i = arr.length() - 200; i < arr.length(); i++) trimmed.put(arr.get(i));
                arr = trimmed;
            }
            p.edit().putString(PREFS_KEY, arr.toString()).apply();
        } catch (Exception ignored) {}
    }

    private void broadcast(JSONObject tx) {
        Intent i = new Intent("com.moniqofi.TX_DETECTED");
        i.setPackage(getPackageName());
        i.putExtra("tx", tx.toString());
        sendBroadcast(i);
    }
}
`;

// ─────────────────────────────────────────────────────────────────────────────

const LISTENER_MODULE = `package com.moniqofi.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.provider.Settings;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.json.JSONObject;

public class NotificationListenerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext ctx;
    private BroadcastReceiver receiver;
    private boolean receiverRegistered = false;

    public NotificationListenerModule(ReactApplicationContext ctx) {
        super(ctx);
        this.ctx = ctx;
    }

    @Override public String getName() { return "NotificationListener"; }

    @Override
    public void initialize() {
        super.initialize();
        try { registerReceiver(); } catch (Exception ignored) {}
    }

    private void registerReceiver() {
        receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                String json = intent.getStringExtra("tx");
                if (json == null) return;
                try {
                    JSONObject tx = new JSONObject(json);
                    WritableMap map = Arguments.createMap();
                    map.putDouble("amount",    tx.getDouble("amount"));
                    map.putString("type",      tx.getString("type"));
                    map.putString("title",     tx.getString("title"));
                    map.putString("description", tx.getString("description"));
                    map.putString("source",    tx.getString("source"));
                    map.putString("category",  tx.getString("category"));
                    map.putDouble("timestamp", tx.getLong("timestamp"));
                    ctx.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                       .emit("TransactionDetected", map);
                } catch (Exception ignored) {}
            }
        };
        IntentFilter filter = new IntentFilter("com.moniqofi.TX_DETECTED");
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            ctx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            ctx.registerReceiver(receiver, filter);
        }
        receiverRegistered = true;
    }

    @ReactMethod
    public void checkPermission(Promise p) {
        try {
            String listeners = Settings.Secure.getString(
                ctx.getContentResolver(), "enabled_notification_listeners");
            p.resolve(listeners != null && listeners.contains(ctx.getPackageName()));
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void openNotificationSettings(Promise p) {
        try {
            Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(i);
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @ReactMethod
    public void getPendingTransactions(Promise p) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences("MoniqoFiTx", Context.MODE_PRIVATE);
            p.resolve(prefs.getString("pending", "[]"));
        } catch (Exception e) { p.resolve("[]"); }
    }

    @ReactMethod
    public void clearPendingTransactions(Promise p) {
        try {
            ctx.getSharedPreferences("MoniqoFiTx", Context.MODE_PRIVATE)
               .edit().putString("pending", "[]").apply();
            p.resolve(true);
        } catch (Exception e) { p.reject("ERR", e.getMessage()); }
    }

    @Override
    public void onCatalystInstanceDestroy() {
        if (receiverRegistered && receiver != null) {
            try { ctx.unregisterReceiver(receiver); } catch (Exception ignored) {}
            receiverRegistered = false;
        }
    }
}
`;

// ─────────────────────────────────────────────────────────────────────────────

const LISTENER_PACKAGE = `package com.moniqofi.app;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class NotificationListenerPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext ctx) {
        return Arrays.<NativeModule>asList(new NotificationListenerModule(ctx));
    }
    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext ctx) {
        return Collections.emptyList();
    }
}
`;

// ─── Config Plugin ────────────────────────────────────────────────────────────

/** Step 1 — Add NotificationListenerService to AndroidManifest.xml */
function addManifestService(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0];
    if (!app.service) app.service = [];

    const alreadyAdded = app.service.some(
      (s) => s.$?.['android:name'] === '.TransactionNotificationService'
    );

    if (!alreadyAdded) {
      app.service.push({
        $: {
          'android:name': '.TransactionNotificationService',
          'android:label': '@string/app_name',
          'android:exported': 'false',
          'android:permission': 'android.permission.BIND_NOTIFICATION_LISTENER_SERVICE',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name':
                    'android.service.notification.NotificationListenerService',
                },
              },
            ],
          },
        ],
      });
    }
    return cfg;
  });
}

/** Step 2 — Write the three Java files into the Android source tree */
function writeJavaFiles(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const javaDir = path.join(
        cfg.modRequest.projectRoot,
        'android', 'app', 'src', 'main', 'java',
        'com', 'moniqofi', 'app'
      );
      fs.mkdirSync(javaDir, { recursive: true });
      fs.writeFileSync(path.join(javaDir, 'TransactionNotificationService.java'), TRANSACTION_SERVICE);
      fs.writeFileSync(path.join(javaDir, 'NotificationListenerModule.java'), LISTENER_MODULE);
      fs.writeFileSync(path.join(javaDir, 'NotificationListenerPackage.java'), LISTENER_PACKAGE);
      return cfg;
    },
  ]);
}

/** Step 3 — Register the package in MainApplication.kt */
function patchMainApplication(config) {
  return withMainApplication(config, (cfg) => {
    let src = cfg.modResults.contents;

    // Already patched? Skip — check for either form.
    if (src.includes('packages.add(NotificationListenerPackage())') ||
        src.includes('add(NotificationListenerPackage())')) {
      // If the wrong bare-add form exists, fix it
      if (src.includes('add(NotificationListenerPackage())') &&
          !src.includes('packages.add(NotificationListenerPackage())')) {
        src = src.replace(
          /\badd\(NotificationListenerPackage\(\)\)/g,
          'packages.add(NotificationListenerPackage())'
        );
        cfg.modResults.contents = src;
      }
      return cfg;
    }

    // Option A: Expo 52 style — PackageList(this).packages.apply { ... }
    if (src.includes('PackageList(this).packages.apply')) {
      src = src.replace(
        /(PackageList\(this\)\.packages\.apply\s*\{)/,
        `$1\n            packages.add(NotificationListenerPackage())`
      );
    }
    // Option B: PackageList(this).packages assigned to variable
    else if (src.includes('PackageList(this).packages')) {
      src = src.replace(
        /(val packages = PackageList\(this\)\.packages)/,
        `$1\n            packages.add(NotificationListenerPackage())`
      );
    }
    // Option C: Generic getPackages override — inject before return
    else if (src.includes('override fun getPackages')) {
      src = src.replace(
        /(override fun getPackages[\s\S]*?)(return [\w]+)/,
        `$1packages.add(NotificationListenerPackage())\n        $2`
      );
    }

    cfg.modResults.contents = src;
    return cfg;
  });
}

// ─── Compose & export ─────────────────────────────────────────────────────────
module.exports = (config) => {
  config = addManifestService(config);
  config = writeJavaFiles(config);
  config = patchMainApplication(config);
  return config;
};
