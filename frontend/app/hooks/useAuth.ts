"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getToken, logout } from "../lib/api";

/**
 * Hook for protected pages. Checks auth state on mount and redirects
 * to /login if not authenticated. Returns auth helpers.
 */
export function useAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  return {
    /** True once auth is confirmed — use to gate rendering */
    ready,
    /** Current JWT token */
    token: getToken(),
    /** Sign out and redirect */
    logout,
  };
}
