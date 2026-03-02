package com.moniqofi.app;

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

    public NotificationListenerModule(ReactApplicationContext ctx) {
        super(ctx);
        this.ctx = ctx;
        registerReceiver();
    }

    @Override public String getName() { return "NotificationListener"; }

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
        ctx.registerReceiver(receiver, filter);
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
        try { ctx.unregisterReceiver(receiver); } catch (Exception ignored) {}
    }
}
