"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  userName?: string;
  healthScore?: number;
  personalityType?: string;
  topCategory?: string;
  topCategoryAmount?: number;
  savingsRate?: number;
  balance?: number;
  totalIncome?: number;
  totalExpense?: number;
  insight?: string;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <motion.circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 1.8, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="relative text-center">
        <div className="text-2xl font-black text-white leading-none">{score}</div>
        <div className="text-[9px] text-gray-500 uppercase tracking-wider mt-0.5">Score</div>
      </div>
    </div>
  );
}

export default function FinancialDNA({ open, onClose, userName = "You", healthScore = 0, personalityType = "Balanced", topCategory = "—", topCategoryAmount = 0, savingsRate = 0, balance = 0, totalIncome = 0, totalExpense = 0, insight }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const scoreColor = healthScore >= 80 ? "#10B981" : healthScore >= 60 ? "#F59E0B" : "#E50914";
  const grade = healthScore >= 90 ? "A+" : healthScore >= 80 ? "A" : healthScore >= 70 ? "B" : healthScore >= 60 ? "C" : "D";

  const metrics = [
    { label: "Savings Rate", value: `${savingsRate.toFixed(1)}%`, color: savingsRate >= 20 ? "#10B981" : "#F59E0B" },
    { label: "Net Balance", value: `₹${Math.abs(balance).toLocaleString("en-IN")}`, color: balance >= 0 ? "#10B981" : "#E50914" },
    { label: "Monthly Income", value: `₹${totalIncome.toLocaleString("en-IN")}`, color: "#6366F1" },
    { label: "Monthly Spend", value: `₹${totalExpense.toLocaleString("en-IN")}`, color: "#a78bfa" },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(`My MoniqoFi Financial DNA:\n• Health Score: ${healthScore} (${grade})\n• Money Personality: ${personalityType}\n• Savings Rate: ${savingsRate.toFixed(1)}%\n• Top Category: ${topCategory}\n\nTrack yours at MoniqoFi!`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div className="fixed inset-0 z-9000" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />

          {/* Modal */}
          <motion.div className="fixed inset-0 z-9001 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="w-full max-w-lg">

              {/* DNA CARD (printable region) */}
              <div ref={cardRef} className="relative overflow-hidden rounded-3xl p-8"
                style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f17 50%, #0a0a0a 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>

                {/* Background glow orbs */}
                <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${scoreColor} 0%, transparent 60%)`, transform: "translate(-50%, -50%)" }} />
                <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #6366F1 0%, transparent 60%)", transform: "translate(40%, 40%)" }} />

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-[0.2em] mb-0.5">Financial DNA</div>
                    <div className="text-xl font-black text-white">{userName}'s Report</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>Grade {grade}</div>
                    <button onClick={onClose} className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 transition-all text-sm">✕</button>
                  </div>
                </div>

                {/* Score + Personality row */}
                <div className="relative z-10 flex items-center gap-6 mb-6 p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <ScoreRing score={healthScore} color={scoreColor} />
                  <div className="flex-1">
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Money Personality</div>
                    <div className="text-2xl font-black text-white leading-tight">{personalityType}</div>
                    <div className="mt-2 text-xs text-gray-500">{insight ?? "Your financial habits reveal a unique spending signature."}</div>
                  </div>
                </div>

                {/* Metrics grid */}
                <div className="relative z-10 grid grid-cols-2 gap-3 mb-6">
                  {metrics.map(m => (
                    <div key={m.label} className="px-4 py-3 rounded-xl" style={{ background: `${m.color}0c`, border: `1px solid ${m.color}25` }}>
                      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">{m.label}</div>
                      <div className="text-base font-black" style={{ color: m.color }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Top Category */}
                <div className="relative z-10 flex items-center gap-3 mb-6 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>🏆</div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">Top Spending Category</div>
                    <div className="text-sm font-bold text-white capitalize">{topCategory} <span className="text-gray-500 font-normal">— ₹{topCategoryAmount.toLocaleString("en-IN")}</span></div>
                  </div>
                </div>

                {/* MoniqoFi watermark */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="text-[9px] text-gray-700 uppercase tracking-[0.2em]">MoniqoFi · Financial Intelligence</div>
                  <div className="flex gap-1">
                    {["#E50914", "#F59E0B", "#10B981", "#6366F1"].map(c => (
                      <div key={c} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button onClick={handleCopy} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:bg-white/10"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy Summary
                </button>
                <button onClick={onClose} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #E50914, #b90010)" }}>
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
