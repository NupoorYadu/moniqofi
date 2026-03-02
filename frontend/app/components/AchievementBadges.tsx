"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  xp: number;
  color: string;
  unlocked: boolean;
}

interface Props {
  transactions: any[];
  summary: { totalIncome: number; totalExpense: number; balance: number } | null;
  budgetStatus: any;
  healthScore?: number;
}

function XPBar({ xp, max }: { xp: number; max: number }) {
  const pct = Math.min((xp / max) * 100, 100);
  const level = Math.floor(xp / 100) + 1;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-black" style={{ background: "linear-gradient(135deg, #F59E0B, #E50914)" }}>
            {level}
          </div>
          <div>
            <div className="text-xs font-bold text-white">Level {level}</div>
            <div className="text-[10px] text-gray-500">Financial Explorer</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-black text-amber-400">{xp} XP</div>
          <div className="text-[10px] text-gray-600">{max - xp} to next level</div>
        </div>
      </div>
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #F59E0B, #E50914)" }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
      </div>
    </div>
  );
}

export default function AchievementBadges({ transactions, summary, budgetStatus, healthScore }: Props) {
  const savings = summary && summary.totalIncome > 0 ? (summary.balance / summary.totalIncome) * 100 : 0;
  const allBudgetsOk = budgetStatus?.budgets?.length > 0 && budgetStatus.budgets.every((b: any) => parseFloat(b.spent) <= parseFloat(b.amount));
  const [unlockAnim, setUnlockAnim] = useState<string | null>(null);

  const achievements: Achievement[] = [
    { id: "first", icon: "🚀", title: "First Steps", desc: "Logged your first transaction", xp: 50, color: "#6366F1", unlocked: transactions.length >= 1 },
    { id: "saver", icon: "🛡️", title: "Saver Shield", desc: "Savings rate above 20%", xp: 100, color: "#10B981", unlocked: savings >= 20 },
    { id: "budget", icon: "👑", title: "Budget Boss", desc: "All budgets within limit", xp: 150, color: "#F59E0B", unlocked: allBudgetsOk },
    { id: "active", icon: "⚡", title: "Active Trader", desc: "Logged 10+ transactions", xp: 80, color: "#a78bfa", unlocked: transactions.length >= 10 },
    { id: "diverse", icon: "🌐", title: "Diversified", desc: "Spent across 4+ categories", xp: 75, color: "#38bdf8", unlocked: new Set(transactions.map((t: any) => t.category)).size >= 4 },
    { id: "health", icon: "❤️", title: "Health Champion", desc: "Financial health score ≥ 80", xp: 200, color: "#E50914", unlocked: (healthScore ?? 0) >= 80 },
    { id: "balance", icon: "💰", title: "In the Black", desc: "Positive account balance", xp: 60, color: "#10B981", unlocked: (summary?.balance ?? 0) > 0 },
    { id: "rich", icon: "💎", title: "Power Saver", desc: "Savings rate above 40%", xp: 250, color: "#F59E0B", unlocked: savings >= 40 },
  ];

  const unlockedList = achievements.filter(a => a.unlocked);
  const totalXP = unlockedList.reduce((s, a) => s + a.xp, 0);
  const nextLevelXP = (Math.floor(totalXP / 100) + 1) * 100;

  // Show unlock animation for newly found achievements
  useEffect(() => {
    const key = "achievements_seen";
    const seen: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    const newOnes = unlockedList.filter(a => !seen.includes(a.id));
    if (newOnes.length > 0) {
      const showNext = (list: Achievement[]) => {
        if (list.length === 0) return;
        setUnlockAnim(list[0].id);
        localStorage.setItem(key, JSON.stringify([...seen, list[0].id]));
        setTimeout(() => { setUnlockAnim(null); setTimeout(() => showNext(list.slice(1)), 400); }, 2500);
      };
      setTimeout(() => showNext(newOnes), 1000);
    }
  }, []);

  return (
    <div className="relative rounded-2xl p-6" style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.07) 0%, transparent 55%)" }} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Achievements</h2>
            <div className="text-xs text-gray-500">{unlockedList.length}/{achievements.length} unlocked</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}>
            {totalXP} XP
          </div>
        </div>

        <XPBar xp={totalXP} max={nextLevelXP} />

        <div className="grid grid-cols-4 gap-3">
          {achievements.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
              className="flex flex-col items-center gap-1.5 text-center">
              <motion.div className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: a.unlocked ? `${a.color}18` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${a.unlocked ? a.color + "40" : "rgba(255,255,255,0.06)"}`,
                  boxShadow: a.unlocked ? `0 0 18px ${a.color}25` : "none",
                  filter: a.unlocked ? "none" : "grayscale(1) opacity(0.35)",
                }}
                whileHover={a.unlocked ? { scale: 1.1, boxShadow: `0 0 28px ${a.color}45` } : {}}>
                {a.icon}
                {a.unlocked && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border border-black flex items-center justify-center text-[8px]" style={{ background: a.color }}>✓</div>
                )}
              </motion.div>
              <div className="text-[10px] font-semibold leading-tight" style={{ color: a.unlocked ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>{a.title}</div>
              {a.unlocked && <div className="text-[9px] font-bold" style={{ color: a.color }}>+{a.xp} XP</div>}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Badge unlock animation */}
      <AnimatePresence>
        {unlockAnim && (() => {
          const a = achievements.find(x => x.id === unlockAnim);
          if (!a) return null;
          return (
            <motion.div key={unlockAnim} initial={{ y: 40, opacity: 0, scale: 0.8 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="absolute bottom-4 right-4 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
              style={{ background: `${a.color}18`, border: `1px solid ${a.color}40`, backdropFilter: "blur(10px)", zIndex: 100 }}>
              <div className="text-2xl">{a.icon}</div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: a.color }}>Achievement Unlocked!</div>
                <div className="text-sm font-black text-white">{a.title}</div>
                <div className="text-[10px] text-gray-400">+{a.xp} XP earned</div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
