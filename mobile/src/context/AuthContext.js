import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getStoredToken,
  storeToken,
  removeToken,
  setOnUnauthorized,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(async () => {
    await removeToken();
    setToken(null);
  }, []);

  useEffect(() => {
    // Load stored token on app launch
    getStoredToken()
      .then((t) => {
        if (t) {
          // Basic JWT expiry check
          try {
            const payload = JSON.parse(atob(t.split(".")[1]));
            if (payload.exp * 1000 > Date.now()) {
              setToken(t);
            } else {
              removeToken(); // Expired — clean up
            }
          } catch {
            setToken(t); // Can't decode — let server validate
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Register global 401 handler so API client can auto-logout
    setOnUnauthorized(handleLogout);
  }, [handleLogout]);

  const login = async (newToken) => {
    await storeToken(newToken);
    setToken(newToken);
  };

  const logout = async () => {
    await handleLogout();
  };

  return (
    <AuthContext.Provider value={{ token, loading, login, logout, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
