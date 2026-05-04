"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { API_BASE } from "../lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Reset token is missing. Use the link from your email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A] relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#E50914]/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#6366F1]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-[#E50914]/3 rounded-full blur-[100px] pointer-events-none" />

      {/* Left decorative panel */}
      <div className="hidden lg:flex w-1/2 items-center justify-center relative p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/8 via-transparent to-transparent" />
        <div className="relative z-10 text-center">
          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl font-black mb-2">
            <span className="text-[#E50914]">Moniqo</span><span className="text-white">Fi</span>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-gray-600 text-sm tracking-widest uppercase mb-12">AI-Powered Finance</motion.p>

          {/* Animated lock visual */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }}
            className="relative flex items-center justify-center mx-auto w-48 h-48">
            <div className="absolute inset-0 rounded-full bg-[#E50914]/10 blur-2xl" />
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="relative z-10">
              <defs>
                <linearGradient id="lockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4555" />
                  <stop offset="100%" stopColor="#B20710" />
                </linearGradient>
                <filter id="lockGlow">
                  <feGaussianBlur stdDeviation="4" result="g" />
                  <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {/* Shackle */}
              <motion.rect x="32" y="48" width="56" height="44" rx="10" fill="url(#lockGrad)" opacity="0.9" filter="url(#lockGlow)"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.9, y: 0 }} transition={{ delay: 0.6, type: "spring" }} />
              <motion.path d="M42 48 V34 A18 18 0 0 1 78 34 V48"
                stroke="url(#lockGrad)" strokeWidth="8" strokeLinecap="round" fill="none"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 6px #E50914)" }} />
              {/* Keyhole */}
              <motion.circle cx="60" cy="68" r="6" fill="#0A0A0A" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.1, type: "spring" }} />
              <motion.rect x="57" y="68" width="6" height="12" rx="3" fill="#0A0A0A" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 1.2 }} />
            </svg>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="mt-10 space-y-3">
            {["Secure 256-bit encryption", "Token expires in 60 minutes", "One-time use reset link"].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-center gap-2 text-xs text-gray-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md">

        {/* Mobile brand */}
        <div className="lg:hidden text-center mb-8">
          <div className="text-3xl font-black"><span className="text-[#E50914]">Moniqo</span><span className="text-white">Fi</span></div>
          <p className="text-gray-600 text-xs tracking-widest uppercase mt-1">AI-Powered Finance</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] p-8 rounded-2xl shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#E50914]/15 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Reset Password</h1>
              <p className="text-gray-500 text-xs">Enter your new password below</p>
            </div>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-green-900/30 border border-green-500/20 text-green-400 p-3.5 rounded-xl mb-4 text-sm text-center">
              {message}
            </motion.div>
          )}

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#E50914]/10 border border-[#E50914]/20 text-[#ff6b7a] p-3.5 rounded-xl mb-4 text-sm text-center">
              {error}
            </motion.div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">New Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/30 transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Confirm Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  className={`w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
                    confirmPassword && confirmPassword !== newPassword
                      ? "border-[#E50914]/50 focus:border-[#E50914]/50 focus:ring-[#E50914]/30"
                      : confirmPassword && confirmPassword === newPassword
                      ? "border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/30"
                      : "border-white/[0.08] focus:border-[#E50914]/50 focus:ring-[#E50914]/30"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {confirmPassword && confirmPassword === newPassword && (
                  <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] disabled:opacity-50 transition-all shadow-lg shadow-[#E50914]/20 mb-4">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                Resetting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Set New Password
              </span>
            )}
          </motion.button>

          <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
            <a href="/login" className="text-xs text-gray-600 hover:text-[#E50914] transition">
              ← Back to Login
            </a>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-700">
              <span className="text-[#E50914]">Moniqo</span><span className="text-white">Fi</span> — AI-Powered Personal Finance
            </p>
          </div>
        </form>
      </motion.div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0A0A0A]"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
