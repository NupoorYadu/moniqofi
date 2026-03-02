package com.moniqofi.app;

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
        "(?:Rs\.?|INR|\u20B9)\s*([\d,]+(?:\.\d{1,2})?)",
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

        boolean hasAmt    = full.contains("\u20B9") || full.toLowerCase().contains("rs.") ||
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
        i.putExtra("tx", tx.toString());
        sendBroadcast(i);
    }
}
