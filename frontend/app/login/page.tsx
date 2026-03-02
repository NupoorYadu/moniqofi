"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import MoniqoLogo from "../components/MoniqoLogo";
import { API_BASE } from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Warm up the Railway backend on page load so cold-start doesn't hit on Sign In
  useEffect(() => {
    fetch(`${API_BASE}/`, { method: "GET" }).catch(() => {/* ignore */});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const attemptLogin = async (): Promise<Response> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25000); // 25s timeout
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        return res;
      } catch (err: unknown) {
        clearTimeout(timer);
        throw err;
      }
    };

    try {
      let res: Response;
      try {
        res = await attemptLogin();
      } catch {
        // First attempt failed (cold start / timeout) — wait 4s and retry once
        setError("Server is waking up, retrying…");
        await new Promise((r) => setTimeout(r, 4000));
        res = await attemptLogin();
      }

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push("/dashboard");
      } else if (data.requiresVerification) {
        router.push(`/check-email?email=${encodeURIComponent(data.email || email)}`);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Unable to reach server. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/20 via-[#0A0A0A] to-[#831010]/10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#E50914]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#6366F1]/8 rounded-full blur-[100px]" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        {/* Floating decorative cards */}
        <div className="relative z-10 px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <MoniqoLogo size={64} />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mt-8 leading-tight">
            Smart Finance,<br /><span className="text-[#E50914]">Smarter You.</span>
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-gray-400 mt-4 text-lg max-w-sm">
            Track, analyze, and grow your wealth with AI-powered insights.
          </motion.p>

          {/* Feature cards */}
          <div className="mt-10 space-y-4">
            {[
              { icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ), title: "Budget Tracking", desc: "Set budgets & get AI alerts", color: "#10B981" },
              { icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              ), title: "Health Score", desc: "Your financial fitness at a glance", color: "#6366F1" },
              { icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              ), title: "Future Simulation", desc: "See where your money takes you", color: "#F59E0B" },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${f.color}15` }}>
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{f.title}</p>
                  <p className="text-gray-500 text-xs">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Floating stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="mt-10 flex gap-6">
            {[
              { val: "10K+", label: "Users" },
              { val: "50M+", label: "Tracked" },
              { val: "98%", label: "Accuracy" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-[#E50914]">{s.val}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Animated circles */}
        <motion.div className="absolute top-20 right-16 w-3 h-3 rounded-full bg-[#E50914]"
          animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.div className="absolute bottom-32 right-24 w-2 h-2 rounded-full bg-[#6366F1]"
          animate={{ y: [0, 10, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
        <motion.div className="absolute top-1/3 right-10 w-1.5 h-1.5 rounded-full bg-[#F59E0B]"
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
      </div>

      {/* Right — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">

          {/* Mobile-only logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <MoniqoLogo size={48} />
          </div>

          <h1 className="text-3xl font-bold text-white text-center lg:text-left">
            Welcome back
          </h1>
          <p className="text-gray-500 mt-2 mb-8 text-center lg:text-left">
            Sign in to continue to <span className="font-semibold"><span className="text-[#E50914]">Moniqo</span><span className="text-white">Fi</span></span>
          </p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#E50914]/10 border border-[#E50914]/20 text-[#ff6b7a] p-3.5 rounded-xl mb-5 text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
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

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/30 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-[#E50914] transition">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] disabled:opacity-50 transition-all shadow-lg shadow-[#E50914]/20">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                  Signing in...
                </span>
              ) : "Sign In"}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-gray-600 uppercase">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#E50914] font-semibold hover:text-[#ff4555] transition">
              Create one
            </Link>
          </p>

          {/* Bottom branding */}
          <div className="mt-10 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-xs text-gray-700">
              <span className="text-[#E50914]">Moniqo</span><span className="text-white">Fi</span> — AI-Powered Personal Finance
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}