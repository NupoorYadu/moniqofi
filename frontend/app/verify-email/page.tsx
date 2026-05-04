"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import MoniqoLogo from "../components/MoniqoLogo";
import { API_BASE } from "../lib/api";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/auth/verify-email?token=${token}`
      );
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(data.message);
        // Auto-login: store JWT
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
      } else {
        setStatus("error");
        setMessage(data.message || "Verification failed");
      }
    } catch {
      setStatus("error");
      setMessage("Unable to connect to server");
    }
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  // Countdown redirect after success
  useEffect(() => {
    if (status !== "success") return;
    if (countdown <= 0) {
      router.push("/dashboard");
      return;
    }
    const t = setTimeout(() => setCountdown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, router]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-8">
          <MoniqoLogo size={56} />
        </div>

        {/* Loading */}
        {status === "loading" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-full border-[3px] border-white/10 border-t-[#E50914]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h1 className="text-2xl font-bold text-white mb-2">Verifying your email...</h1>
            <p className="text-gray-500 text-sm">Please wait while we confirm your email address</p>
          </motion.div>
        )}

        {/* Success */}
        {status === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            {/* Animated checkmark */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <motion.svg
                width="36" height="36" viewBox="0 0 24 24" fill="none"
                stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.polyline
                  points="20 6 9 17 4 12"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </motion.svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
            <p className="text-gray-400 text-sm mb-6">{message}</p>

            <motion.button
              onClick={() => router.push("/dashboard")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] transition-all shadow-lg shadow-[#E50914]/20"
            >
              Go to Dashboard
            </motion.button>

            <p className="text-gray-600 text-xs mt-4">
              Redirecting automatically in {countdown}s...
            </p>
          </motion.div>
        )}

        {/* Error */}
        {status === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#E50914]/10 border border-[#E50914]/20 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
            <p className="text-gray-400 text-sm mb-6">{message}</p>

            <div className="space-y-3">
              <Link href="/login"
                className="block w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] transition-all shadow-lg shadow-[#E50914]/20 text-center">
                Go to Login
              </Link>
              <Link href="/register"
                className="block w-full py-3.5 rounded-xl font-semibold text-gray-400 border border-white/[0.08] hover:border-white/20 transition-all text-center">
                Register Again
              </Link>
            </div>
          </motion.div>
        )}

        {/* No token */}
        {status === "no-token" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
            <p className="text-gray-400 text-sm mb-6">No verification token found. Please use the link from your email.</p>

            <Link href="/login"
              className="block w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] transition-all shadow-lg shadow-[#E50914]/20 text-center">
              Go to Login
            </Link>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/[0.04] text-center">
          <p className="text-xs text-gray-700">
            <span className="text-[#E50914]">Moniqo</span>Fi — AI-Powered Personal Finance
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E50914] border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
