"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Sub {
  title: string;
  amount: number;
  category: string;
  lastSeen?: string;
}

function getDay(sub: Sub): number {
  if (sub.lastSeen) {
    const d = new Date(sub.lastSeen);
    return d.getDate();
  }
  // Deterministic fallback based on title hash
  let h = 0;
  for (let i = 0; i < sub.title.length; i++) h = (h * 31 + sub.title.charCodeAt(i)) % 28;
  return h + 1;
}

const CAT_COLORS: Record<string, string> = {
  streaming: "#E50914", entertainment: "#E50914",
  gym: "#10B981", health: "#10B981", fitness: "#10B981",
  cloud: "#6366F1", software: "#6366F1", tools: "#6366F1",
  food: "#F59E0B", groceries: "#F59E0B",
  utilities: "#a78bfa", bills: "#a78bfa",
};
function catColor(cat: string): string {
  return CAT_COLORS[cat.toLowerCase()] ?? "#6b7280";
}

export default function BillingCalendar({ subscriptions }: { subscriptions: Sub[] }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [hovered, setHovered] = useState<number | null>(null);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString("default", { month: "long" });

  // Map day → subs due
  const byDay: Record<number, Sub[]> = {};
  for (const sub of subscriptions) {
    const d = getDay(sub);
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(sub);
  }

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const totalDue = Object.entries(byDay)
    .filter(([d]) => Number(d) >= today.getDate() || month !== today.getMonth() || year !== today.getFullYear())
    .reduce((sum, [, subs]) => sum + subs.reduce((s, sub) => s + sub.amount, 0), 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest">Billing</div>
            <div className="text-sm font-bold text-white">Charges Calendar</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { const d = new Date(year, month - 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-sm font-semibold text-white min-w-[100px] text-center">{monthName} {year}</span>
          <button onClick={() => { const d = new Date(year, month + 1); setMonth(d.getMonth()); setYear(d.getFullYear()); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-4 pt-3 pb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-[10px] uppercase tracking-widest text-gray-600 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-5">
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const subs = day ? byDay[day] ?? [] : [];
          const hasSubs = subs.length > 0;
          return (
            <div key={i} className="relative"
              onMouseEnter={() => hasSubs && day ? setHovered(day) : undefined}
              onMouseLeave={() => setHovered(null)}>
              <motion.div
                className="aspect-square rounded-xl flex flex-col items-center justify-center relative cursor-default"
                style={{
                  background: isToday ? "rgba(229,9,20,0.18)" : hasSubs ? "rgba(255,255,255,0.04)" : "transparent",
                  border: isToday ? "1px solid rgba(229,9,20,0.45)" : hasSubs ? "1px solid rgba(255,255,255,0.07)" : "1px solid transparent",
                }}
                whileHover={hasSubs ? { scale: 1.06 } : {}}
              >
                {day && (
                  <>
                    <span className="text-xs font-semibold" style={{ color: isToday ? "#E50914" : hasSubs ? "#ccc" : "#444" }}>{day}</span>
                    {hasSubs && (
                      <div className="flex gap-0.5 mt-0.5">
                        {subs.slice(0, 3).map((s, si) => (
                          <div key={si} className="w-1.5 h-1.5 rounded-full" style={{ background: catColor(s.category) }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>

              {/* Hover tooltip */}
              <AnimatePresence>
                {hovered === day && hasSubs && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 min-w-[160px] rounded-xl p-3 shadow-2xl pointer-events-none"
                    style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Due on day {day}</div>
                    {subs.map((s, si) => (
                      <div key={si} className="flex items-center justify-between gap-3 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: catColor(s.category) }} />
                          <span className="text-xs text-gray-300 truncate max-w-[90px]">{s.title}</span>
                        </div>
                        <span className="text-xs font-bold text-white shrink-0">₹{s.amount.toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                      <span className="text-[10px] text-gray-600">Total</span>
                      <span className="text-xs font-black text-[#E50914]">₹{subs.reduce((s, x) => s + x.amount, 0).toLocaleString("en-IN")}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Month total */}
      <div className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-center justify-between" style={{ background: "rgba(229,9,20,0.08)", border: "1px solid rgba(229,9,20,0.2)" }}>
        <span className="text-xs text-gray-500">Remaining bills this month</span>
        <span className="text-sm font-black text-[#E50914]">₹{totalDue.toLocaleString("en-IN")}</span>
      </div>
    </div>
  );
}
