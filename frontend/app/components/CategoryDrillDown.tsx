"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  date?: string;
  createdAt?: string;
}

interface Props {
  category: string | null;
  transactions: Transaction[];
  onClose: () => void;
}

const CAT_COLORS: Record<string, string> = {
  food: "#F59E0B", groceries: "#F59E0B",
  entertainment: "#E50914", streaming: "#E50914",
  transport: "#6366F1", travel: "#6366F1",
  health: "#10B981", gym: "#10B981",
  shopping: "#a78bfa", utilities: "#38bdf8",
};
function catColor(cat: string) { return CAT_COLORS[cat?.toLowerCase()] ?? "#6b7280"; }

export default function CategoryDrillDown({ category, transactions, onClose }: Props) {
  const filtered = transactions.filter(t => t.category?.toLowerCase() === category?.toLowerCase());
  const total = filtered.reduce((s, t) => s + t.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;
  const max = filtered.reduce((m, t) => Math.max(m, t.amount), 0);
  const c = catColor(category ?? "");

  return (
    <AnimatePresence>
      {category && (
        <>
          {/* Backdrop */}
          <motion.div className="fixed inset-0 z-8000" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />

          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-8001 w-96 flex flex-col shadow-2xl"
            style={{ background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 36 }}
          >
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${c}18 0%, transparent 55%)` }} />

            {/* Header */}
            <div className="relative z-10 flex items-center gap-3 px-6 py-5 border-b border-white/6">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg text-white shrink-0"
                style={{ background: `${c}25`, border: `1px solid ${c}40`, boxShadow: `0 0 20px ${c}30` }}>
                {(category?.[0] ?? "?").toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-gray-600 uppercase tracking-widest">Category</div>
                <div className="text-base font-bold text-white capitalize">{category}</div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Stat mini-cards */}
            <div className="relative z-10 grid grid-cols-3 gap-3 p-4 border-b border-white/5">
              {[
                { label: "Total", val: `₹${total.toLocaleString("en-IN")}`, col: c },
                { label: "Avg", val: `₹${Math.round(avg).toLocaleString("en-IN")}`, col: "#6366F1" },
                { label: "Txns", val: `${filtered.length}`, col: "#10B981" },
              ].map(s => (
                <div key={s.label} className="text-center px-2 py-3 rounded-xl" style={{ background: `${s.col}0e`, border: `1px solid ${s.col}25` }}>
                  <div className="text-xs font-black" style={{ color: s.col }}>{s.val}</div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Transaction list */}
            <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-3">All Transactions</div>
              {filtered.length === 0 ? (
                <div className="text-center text-gray-600 text-sm py-8">No transactions in this category</div>
              ) : (
                filtered.map((t, i) => {
                  const barW = max > 0 ? (t.amount / max) * 100 : 0;
                  const dateStr = t.date || t.createdAt ? new Date(t.date || t.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
                  return (
                    <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="relative overflow-hidden rounded-xl px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      {/* Mini bar bg */}
                      <div className="absolute inset-0 rounded-xl" style={{ width: `${barW}%`, background: `${c}0a` }} />
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate capitalize">{t.title}</div>
                          {dateStr && <div className="text-[10px] text-gray-600 mt-0.5">{dateStr}</div>}
                        </div>
                        <div className="text-sm font-black shrink-0 ml-3" style={{ color: t.type === "income" ? "#10B981" : c }}>
                          {t.type === "income" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
