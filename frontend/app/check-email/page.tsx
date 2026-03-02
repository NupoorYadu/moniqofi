"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import MoniqoLogo from "../components/MoniqoLogo";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError("");
    setResent(false);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setResent(true);
        setCooldown(60); // 60s cooldown
      } else {
        setError(data.message || "Failed to resend");
      }
    } catch {
      setError("Unable to connect to server");
    } finally {
      setResending(false);
    }
  };

  /* Mask email: jo***@example.com */
  const maskEmail = (e: string) => {
    if (!e) return "";
    const [local, domain] = e.split("@");
    if (!domain) return e;
    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}@${domain}`;
  };

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

        {/* Envelope icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-center justify-center"
        >
          <motion.svg
            width="44" height="44" viewBox="0 0 24 24" fill="none"
            stroke="#E50914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </motion.svg>
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-3">Check your email</h1>

        <p className="text-gray-400 text-sm mb-2 leading-relaxed">
          We&apos;ve sent a verification link to
        </p>
        {email && (
          <p className="text-white font-semibold text-base mb-6">
            {maskEmail(email)}
          </p>
        )}
        {!email && (
          <p className="text-gray-500 text-sm mb-6">your registered email address</p>
        )}

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-6 text-left">
          <p className="text-gray-300 text-sm font-medium mb-3">Next steps:</p>
          <ul className="space-y-2.5">
            {[
              "Open your email inbox",
              "Click the \"Verify My Email\" button",
              "You'll be automatically signed in",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400 text-sm">
                <span className="w-5 h-5 rounded-full bg-[#E50914]/10 border border-[#E50914]/20 flex items-center justify-center text-[#E50914] text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Resend */}
        {email && (
          <div className="mb-6">
            {resent && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-emerald-400 text-sm mb-3"
              >
                Verification email resent!
              </motion.p>
            )}
            {error && (
              <p className="text-[#ff6b7a] text-sm mb-3">{error}</p>
            )}
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-sm text-gray-400 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Didn't receive the email? Resend"}
            </button>
          </div>
        )}

        {/* Tips */}
        <p className="text-gray-600 text-xs mb-8">
          Check your spam/junk folder if you don&apos;t see the email within a few minutes.
        </p>

        <Link
          href="/login"
          className="text-sm text-[#E50914] font-semibold hover:text-[#ff4555] transition"
        >
          Back to Login
        </Link>

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

export default function CheckEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#E50914] border-t-transparent animate-spin" />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
