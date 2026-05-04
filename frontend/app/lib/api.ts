"use client";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/[\r\n\s]+/g, "") || "http://localhost:5000";
const API = API_BASE;

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/** Centralized API fetch with auto token attachment and 401 handling */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const res = await fetch(`${API}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (res.status === 401) {
      // Token expired or invalid — clear and redirect
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new AuthError("Session expired. Please log in again.");
    }

    const data = await res.json();

    if (!res.ok) {
      const err = new Error(data.message || data.error || `Request failed (${res.status})`);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/** Get stored auth token */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Basic JWT expiry check (decode payload without verification)
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

/** Clear auth state */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  window.location.href = "/login";
}
