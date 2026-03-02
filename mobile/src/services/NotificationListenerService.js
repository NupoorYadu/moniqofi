/**
 * NotificationListenerService.js
 *
 * JavaScript bridge to the native NotificationListener module.
 * Works on Android only (iOS has no notification listener API).
 *
 * Usage:
 *   import NLService from '../services/NotificationListenerService';
 *   const hasPermission = await NLService.checkPermission();
 */

import { NativeModules, Platform } from 'react-native';

const { NotificationListener } = NativeModules;

const IS_ANDROID = Platform.OS === 'android';

// ─── Bank / UPI keyword patterns for extra JS-side filtering ─────────────────
const AMOUNT_RE = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;
const AUTO_CATEGORIES = [
  { regex: /zomato|swiggy|food|restaurant|cafe|dining|blinkit/i,  cat: 'Food & Dining' },
  { regex: /amazon|flipkart|myntra|meesho|nykaa|shopping/i,       cat: 'Shopping' },
  { regex: /ola|uber|rapido|metro|irctc|flight|travel|makemytrip/i, cat: 'Travel' },
  { regex: /netflix|spotify|hotstar|prime|subscription/i,          cat: 'Subscriptions' },
  { regex: /electricity|water|gas|broadband|recharge|bill/i,       cat: 'Utilities' },
  { regex: /hospital|pharmacy|medical|doctor|health/i,             cat: 'Health' },
  { regex: /rent|maintenance|society/i,                            cat: 'Housing' },
  { regex: /salary|payroll|stipend/i,                              cat: 'Income' },
];

export function categorize(text = '') {
  for (const { regex, cat } of AUTO_CATEGORIES) {
    if (regex.test(text)) return cat;
  }
  return 'Other';
}

export function parseAmountFromText(text = '') {
  const m = text.match(AMOUNT_RE);
  if (!m) return null;
  return parseFloat(m[1].replace(/,/g, ''));
}

// ─── Main service object ──────────────────────────────────────────────────────
const NLServiceImpl = {
  /**
   * Returns true if the app has Notification Listener permission.
   */
  async checkPermission() {
    if (!IS_ANDROID || !NotificationListener) return false;
    try {
      return await NotificationListener.checkPermission();
    } catch {
      return false;
    }
  },

  /**
   * Opens Android Settings → Notification Access.
   * The user must manually toggle on MoniqoFi.
   */
  async openSettings() {
    if (!IS_ANDROID || !NotificationListener) return;
    await NotificationListener.openNotificationSettings();
  },

  /**
   * Returns all transactions captured while the app was in background.
   */
  async getPendingTransactions() {
    if (!IS_ANDROID || !NotificationListener) return [];
    try {
      const raw = await NotificationListener.getPendingTransactions();
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Clears the pending-transaction queue stored in SharedPreferences.
   */
  async clearPendingTransactions() {
    if (!IS_ANDROID || !NotificationListener) return;
    try {
      await NotificationListener.clearPendingTransactions();
    } catch {}
  },
};

export default NLServiceImpl;
