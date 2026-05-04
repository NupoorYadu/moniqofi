"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AuthVisual } from "../components/PageVisuals";
import { API_BASE } from "../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || "Password reset link sent to your email!");
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#6366F1]/6 rounded-full blur-[100px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md">

        <AuthVisual />

        <form
          onSubmit={handleSubmit}
          className="dark-card p-8 rounded-2xl border border-white/[0.06]"
        >
          <h1 className="text-3xl font-bold mb-2 text-white text-center">
            <span className="gradient-text">Forgot Password</span>
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Enter your email to receive a reset link
          </p>

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

          <div className="mb-6">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/30 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <motion.button type="submit" disabled={loading}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] disabled:opacity-50 transition-all shadow-lg shadow-[#E50914]/20 mb-4">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                Sending...
              </span>
            ) : "Send Reset Link"}
          </motion.button>

          <p className="text-center text-sm">
            <a href="/login" className="text-gray-400 hover:text-[#E50914] font-semibold transition">
              Back to Login
            </a>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
