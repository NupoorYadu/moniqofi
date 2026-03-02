"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import MoniqoLogo from "../components/MoniqoLogo";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // Redirect to check-email page
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  /* Password strength */
  const getStrength = () => {
    if (!password) return { pct: 0, label: "", color: "#333" };
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (s <= 1) return { pct: 20, label: "Weak", color: "#E50914" };
    if (s <= 2) return { pct: 40, label: "Fair", color: "#F59E0B" };
    if (s <= 3) return { pct: 60, label: "Good", color: "#F59E0B" };
    if (s <= 4) return { pct: 80, label: "Strong", color: "#10B981" };
    return { pct: 100, label: "Excellent", color: "#10B981" };
  };
  const strength = getStrength();

  return (
    <div className="min-h-screen flex bg-[#0A0A0A]">
      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-bl from-[#6366F1]/15 via-[#0A0A0A] to-[#E50914]/10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#6366F1]/8 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#E50914]/8 rounded-full blur-[100px]" />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <MoniqoLogo size={64} />
          </motion.div>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-white mt-8 leading-tight">
            Take Control of<br /><span className="text-[#6366F1]">Your Finances</span>
          </motion.h2>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-gray-400 mt-4 text-lg max-w-sm">
            Join thousands who trust MoniqoFi to manage their money smarter.
          </motion.p>

          {/* Timeline / Steps */}
          <div className="mt-10 space-y-0">
            {[
              { step: "01", title: "Create Account", desc: "Quick, free signup in seconds", color: "#E50914" },
              { step: "02", title: "Add Transactions", desc: "Manual or auto bank sync", color: "#6366F1" },
              { step: "03", title: "Get AI Insights", desc: "Personalized financial coaching", color: "#10B981" },
              { step: "04", title: "Grow Wealth", desc: "Watch your score improve", color: "#F59E0B" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.12 }}
                className="flex items-start gap-4 relative">
                {/* Connector line */}
                {i < 3 && <div className="absolute left-[19px] top-10 w-px h-8 bg-white/[0.06]" />}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border"
                  style={{ borderColor: `${s.color}40`, color: s.color, background: `${s.color}10` }}>
                  {s.step}
                </div>
                <div className="pb-8">
                  <p className="text-white font-medium text-sm">{s.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
            className="mt-4 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#E50914", "#6366F1", "#10B981", "#F59E0B"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: c, zIndex: 4 - i }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Trusted by <span className="text-white font-medium">10,000+</span> users</p>
          </motion.div>
        </div>

        {/* Floating dots */}
        <motion.div className="absolute top-16 left-20 w-3 h-3 rounded-full bg-[#6366F1]"
          animate={{ y: [0, -12, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.div className="absolute bottom-28 right-16 w-2 h-2 rounded-full bg-[#E50914]"
          animate={{ y: [0, 8, 0], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
      </div>

      {/* Right — Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">

          {/* Mobile-only logo */}
          <div className="flex justify-center mb-6 lg:hidden">
            <MoniqoLogo size={48} />
          </div>

          <h1 className="text-3xl font-bold text-white text-center lg:text-left">
            Create your account
          </h1>
          <p className="text-gray-500 mt-2 mb-8 text-center lg:text-left">
            Start your journey with <span className="text-[#E50914] font-semibold">MoniqoFi</span>
          </p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#E50914]/10 border border-[#E50914]/20 text-[#ff6b7a] p-3.5 rounded-xl mb-5 text-sm text-center">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Full Name</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <input type="text" placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/30 transition-all"
                  value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input type="email" placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/30 transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input type={showPassword ? "text" : "password"} placeholder="Min 6 characters"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#E50914]/50 focus:ring-1 focus:ring-[#E50914]/30 transition-all"
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
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
              {/* Strength bar */}
              {password && (
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: strength.color }}
                      initial={{ width: 0 }} animate={{ width: `${strength.pct}%` }} transition={{ duration: 0.4 }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 block">Confirm Password</label>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <input type="password" placeholder="Re-enter password"
                  className={`w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-all ${
                    confirmPassword && confirmPassword !== password
                      ? "border-[#E50914]/50 focus:border-[#E50914]/50 focus:ring-[#E50914]/30"
                      : confirmPassword && confirmPassword === password
                      ? "border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/30"
                      : "border-white/[0.08] focus:border-[#E50914]/50 focus:ring-[#E50914]/30"
                  }`}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                {confirmPassword && confirmPassword === password && (
                  <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>

            {/* Submit */}
            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#E50914] to-[#B20710] hover:from-[#ff1a25] hover:to-[#E50914] disabled:opacity-50 transition-all shadow-lg shadow-[#E50914]/20 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                  Creating account...
                </span>
              ) : "Create Account"}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-gray-600 uppercase">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#E50914] font-semibold hover:text-[#ff4555] transition">
              Sign in
            </Link>
          </p>

          {/* Bottom branding */}
          <div className="mt-8 pt-6 border-t border-white/[0.04] text-center">
            <p className="text-xs text-gray-700">
              <span className="text-[#E50914]">Moniqo</span>Fi — AI-Powered Personal Finance
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
