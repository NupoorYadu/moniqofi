/**
 * useNotificationListener.js
 *
 * React hook that:
 *  1. Checks / requests Notification Listener permission
 *  2. Listens to live "TransactionDetected" native events
 *  3. Flushes background-captured transactions on mount
 *  4. Auto-syncs new transactions to the backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { NativeEventEmitter, NativeModules, AppState, Platform } from 'react-native';
import NLService from '../services/NotificationListenerService';
import { api } from '../api/client';

const { NotificationListener } = NativeModules;

export default function useNotificationListener() {
  const [hasPermission, setHasPermission] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [syncedCount, setSyncedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const appState = useRef(AppState.currentState);

  // ── Check permission ───────────────────────────────────────────────────────
  const checkPermission = useCallback(async () => {
    const ok = await NLService.checkPermission();
    setHasPermission(ok);
    return ok;
  }, []);

  const requestPermission = useCallback(async () => {
    await NLService.openSettings();
    // Poll for ~8 s after user returns from settings
    let attempts = 0;
    const iv = setInterval(async () => {
      const ok = await NLService.checkPermission();
      if (ok || attempts++ > 8) {
        clearInterval(iv);
        setHasPermission(ok);
      }
    }, 1000);
  }, []);

  // ── Sync a list of transactions to backend ─────────────────────────────────
  const syncToBackend = useCallback(async (txList) => {
    if (!txList || txList.length === 0) return;
    setIsLoading(true);
    let saved = 0;
    for (const tx of txList) {
      try {
        await api.post('/transactions', {
          title:       tx.title,
          amount:      tx.amount,
          type:        tx.type,
          category:    tx.category,
          date:        new Date(tx.timestamp).toISOString().split('T')[0],
          description: tx.description,
          source:      tx.source || 'notification',
        });
        saved++;
      } catch {}
    }
    setSyncedCount((c) => c + saved);
    setIsLoading(false);
    return saved;
  }, []);

  // ── Flush pending (background-captured) transactions ──────────────────────
  const flushPending = useCallback(async () => {
    const pending = await NLService.getPendingTransactions();
    if (pending.length > 0) {
      setLiveTransactions((prev) => [...pending, ...prev].slice(0, 100));
      await syncToBackend(pending);
      await NLService.clearPendingTransactions();
    }
  }, [syncToBackend]);

  // ── Live event listener (foreground) ─────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android' || !NotificationListener) return;

    checkPermission();
    flushPending();

    const emitter = new NativeEventEmitter(NotificationListener);
    const sub = emitter.addListener('TransactionDetected', async (tx) => {
      setLiveTransactions((prev) => [tx, ...prev].slice(0, 100));
      await syncToBackend([tx]);
    });

    // Re-flush when app comes to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (appState.current.match(/inactive|background/) && state === 'active') {
        flushPending();
        checkPermission();
      }
      appState.current = state;
    });

    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, [checkPermission, flushPending, syncToBackend]);

  return {
    hasPermission,
    liveTransactions,
    syncedCount,
    isLoading,
    checkPermission,
    requestPermission,
    flushPending,
    clearLocal: () => setLiveTransactions([]),
  };
}
