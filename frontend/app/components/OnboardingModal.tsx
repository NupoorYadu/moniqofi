"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to MoniqoFi",
    subtitle: "Your AI-powered financial command centre",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    color: "#E50914",
  },
  {
    id: "health",
    title: "Track Your Health Score",
    subtitle: "Your financial wellness is scored across 5 categories in real-time — savings, expenses, emergency fund, budgets, and consistency.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    color: "#10B981",
  },
  {
    id: "personality",
    title: "Know Your Money DNA",
    subtitle: "AI analyses your spending behaviour and assigns you a money personality — Balanced Planner, Impulsive Spender, Risk-Taker and more.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
      </svg>
    ),
    color: "#6366F1",
  },
  {
    id: "goals",
    title: "Set Goals, Crush Them",
    subtitle: "Define savings goals and watch your progress with animated rings and AI-predicted completion dates.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    color: "#F59E0B",
  },
  {
    id: "start",
    title: "You're All Set 🎉",
    subtitle: "Your dashboard is ready. Press Ctrl+K anytime to navigate instantly. Add your first transaction to get started.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    color: "#E50914",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const done = localStorage.getItem("onboardingDone");
    const token = localStorage.getItem("token");
    if (!done && token) setVisible(true);
  }, []);

  const finish = () => {
    localStorage.setItem("onboardingDone", "1");
    setVisible(false);
    router.push("/dashboard");
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9800] flex items-center justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)" }}
        >
          <motion.div
            className="relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden"
            style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)" }}
            initial={{ scale: 0.88, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            {/* BG glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 30%, ${current.color}15 0%, transparent 60%)` }} />

            {/* Progress dots */}
            <div className="relative z-10 flex items-center justify-center gap-2 pt-8">
              {STEPS.map((_, i) => (
                <button key={i} onClick={() => setStep(i)}>
                  <motion.div
                    className="rounded-full transition-all duration-300"
                    style={{ width: i === step ? 24 : 8, height: 8, background: i === step ? current.color : i < step ? `${current.color}60` : "rgba(255,255,255,0.1)" }}
                    layout transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                </button>
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}
                className="relative z-10 flex flex-col items-center text-center px-10 py-8">
                {/* Icon */}
                <motion.div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                  style={{ background: `${current.color}18`, border: `1px solid ${current.color}35`, boxShadow: `0 0 40px ${current.color}30` }}
                  initial={{ scale: 0.5, rotate: -15 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.05 }}>
                  {current.icon}
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-3">{current.title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed max-w-sm">{current.subtitle}</p>

                {/* Feature list for welcome step */}
                {step === 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="mt-6 grid grid-cols-2 gap-3 w-full">
                    {[
                      ["Health Score", "#10B981"],
                      ["AI Coach", "#6366F1"],
                      ["Goals", "#F59E0B"],
                      ["Personality", "#E50914"],
                    ].map(([label, col]) => (
                      <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl text-left"
                        style={{ background: `${col}10`, border: `1px solid ${col}20` }}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: col }} />
                        <span className="text-xs font-semibold text-gray-300">{label}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="relative z-10 flex items-center justify-between px-10 pb-8 gap-3">
              <button
                onClick={() => step > 0 ? setStep(s => s - 1) : finish()}
                className="text-sm text-gray-600 hover:text-gray-400 transition-colors"
              >
                {step > 0 ? "← Back" : "Skip"}
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => isLast ? finish() : setStep(s => s + 1)}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: current.color, boxShadow: `0 0 24px ${current.color}55` }}
              >
                {isLast ? "Go to Dashboard →" : "Next →"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
