import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Android emulator uses 10.0.2.2 to reach host localhost
// iOS simulator uses localhost directly
// For physical devices / production, use your real API URL
const DEV_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://localhost:5000";

// Set EXPO_PUBLIC_API_URL in .env or eas.json for production builds
const BASE = process.env.EXPO_PUBLIC_API_URL || DEV_BASE;

export const API_URL = BASE;

const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second

// Callback for global logout (set by AuthContext)
let _onUnauthorized = null;
export function setOnUnauthorized(cb) {
  _onUnauthorized = cb;
}

/** Get stored auth token (secure storage with AsyncStorage fallback) */
export async function getStoredToken() {
  try {
    return await SecureStore.getItemAsync("token");
  } catch {
    // SecureStore not available (web) — fall back
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    return AsyncStorage.getItem("token");
  }
}

/** Store auth token securely */
export async function storeToken(token) {
  try {
    await SecureStore.setItemAsync("token", token);
  } catch {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    await AsyncStorage.setItem("token", token);
  }
}

/** Remove stored auth token */
export async function removeToken() {
  try {
    await SecureStore.deleteItemAsync("token");
  } catch {
    const AsyncStorage = require("@react-native-async-storage/async-storage").default;
    await AsyncStorage.removeItem("token");
  }
}

/** Fetch with timeout */
function fetchWithTimeout(url, options, timeout = REQUEST_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Request timed out. Please check your connection."));
    }, timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

/**
 * Authenticated fetch wrapper.
 * - Auto-attaches Bearer token from SecureStore
 * - 30s request timeout
 * - Auto-retry on network errors (up to 2 retries)
 * - Auto-logout on 401
 */
export async function apiFetch(path, options = {}) {
  const token = await getStoredToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `${API_URL}${path}`,
        { ...options, headers },
        REQUEST_TIMEOUT
      );

      // Handle 401 — unauthorized / token expired
      if (res.status === 401) {
        await removeToken();
        if (_onUnauthorized) _onUnauthorized();
        const err = new Error("Session expired. Please log in again.");
        err.status = 401;
        throw err;
      }

      const data = await res.json();

      if (!res.ok) {
        const error = new Error(data.message || data.error || `Request failed (${res.status})`);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      lastError = err;

      // Don't retry on auth errors or client errors (4xx)
      if (err.status && err.status >= 400 && err.status < 500) throw err;

      // Retry only on network / timeout errors
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// Convenience methods
export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) =>
    apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: "DELETE" }),
};

/**
 * Multipart form-data upload (for CSV import etc).
 * Does NOT set Content-Type — fetch sets it automatically with boundary.
 */
export async function uploadFormData(path, formData) {
  const token = await getStoredToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetchWithTimeout(
    `${API_URL}${path}`,
    { method: "POST", headers, body: formData },
    REQUEST_TIMEOUT
  );

  if (res.status === 401) {
    await removeToken();
    if (_onUnauthorized) _onUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.error || `Upload failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

