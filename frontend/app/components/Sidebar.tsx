"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, type ReactElement } from "react";
import MoniqoLogo from "./MoniqoLogo";

/* Clean SVG icon paths for each nav item */
const icons: Record<string, ReactElement> = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  health: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  personality: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
  simulation: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  subscriptions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  goals: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  coach: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  bank: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", iconKey: "dashboard", desc: "Overview" },
  { href: "/health-score", label: "Health Score", iconKey: "health", desc: "Financial health" },
  { href: "/personality", label: "Personality", iconKey: "personality", desc: "Money mindset" },
  { href: "/simulation", label: "Future You", iconKey: "simulation", desc: "Projections" },
  { href: "/subscriptions", label: "Subscriptions", iconKey: "subscriptions", desc: "Recurring" },
  { href: "/goals", label: "Goals", iconKey: "goals", desc: "Targets" },
  { href: "/coach", label: "AI Coach", iconKey: "coach", desc: "Get advice" },
  { href: "/bank-connect", label: "Bank Connect", iconKey: "bank", desc: "AA live sync" },
  { href: "/import", label: "Import CSV", iconKey: "upload", desc: "Bank statement" },
];

import { logout, API_BASE } from "../lib/api";
import { useTheme, ACCENT_PRESETS } from "../context/ThemeContext";

// ─── Money Weather ──────────────────────────────────────────────────
const MW_API = API_BASE;
type WeatherState = {
  condition: "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "storm";
  emoji: string; label: string; forecast: string;
  skyA: string; skyB: string; particleColor: string;
};
function getWeather(avgBudgetPct: number, healthScore: number): WeatherState {
  if (avgBudgetPct < 55 && healthScore >= 75)
    return { condition: "sunny",        emoji: "☀️",  label: "Financially Clear",  forecast: "Great spending control today",    skyA: "#1a1400", skyB: "#0a0a00", particleColor: "#F59E0B" };
  if (avgBudgetPct < 70 && healthScore >= 60)
    return { condition: "partly-cloudy", emoji: "🌤️",  label: "Mostly On Track",     forecast: "Minor clouds, you're doing well",   skyA: "#0e1520", skyB: "#080d14", particleColor: "#60A5FA" };
  if (avgBudgetPct < 85 && healthScore >= 45)
    return { condition: "cloudy",        emoji: "⛅",  label: "Caution Ahead",      forecast: "Some budgets need attention",       skyA: "#111118", skyB: "#0a0a10", particleColor: "#8B5CF6" };
  if (avgBudgetPct < 100 && healthScore >= 30)
    return { condition: "rainy",         emoji: "🌧️",  label: "Budget Pressure",    forecast: "Overspending in some categories",   skyA: "#0a0e1a", skyB: "#060810", particleColor: "#6366F1" };
  return   { condition: "storm",         emoji: "⛈️",  label: "Storm Warning!",     forecast: "Critical: budgets overrun badly",  skyA: "#1a0505", skyB: "#0d0303", particleColor: "#E50914" };
}
// ─────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
  };
  const { accent, setAccent } = useTheme();

  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [healthNum, setHealthNum] = useState(0);
  const [budgetPct, setBudgetPct] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const h = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${MW_API}/api/health-score`, { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch(`${MW_API}/api/budgets/status?days=30`, { headers: h }).then(r => r.json()).catch(() => ({})),
    ]).then(([hd, bd]) => {
      const score = typeof hd?.score === "number" ? hd.score : 65;
      const budgets: any[] = bd?.budgets ?? [];
      const avg = budgets.length
        ? budgets.reduce((s: number, b: any) => s + (b.percentage ?? 0), 0) / budgets.length
        : 50;
      setHealthNum(score);
      setBudgetPct(Math.round(avg));
      setWeather(getWeather(avg, score));
    });
  }, []);

  return (
    <motion.aside
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 30 }}
      className="w-64 h-screen fixed top-0 left-0 z-40 flex flex-col"
      style={{
        background: "linear-gradient(180deg, #0D0D0D 0%, #111111 50%, #0A0A0A 100%)",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* Logo */}
      <div className="p-6 pb-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-[#E50914]/20">
              <MoniqoLogo size={40} />
            </div>
            <motion.div
              className="absolute inset-0 rounded-xl bg-[#E50914]/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-red-600">Moniqo</span><span className="text-white">Fi</span>
            </h1>
            <p className="text-[10px] text-gray-500 tracking-widest uppercase">Smart Finance</p>
          </div>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl relative transition-all duration-300 group ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {/* Active background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, transparent), color-mix(in srgb, var(--accent) 5%, transparent))",
                      border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Hover background */}
                <AnimatePresence>
                  {hoveredIndex === i && !isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 rounded-xl bg-white/3"
                    />
                  )}
                </AnimatePresence>

                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
                    style={{ background: "var(--accent)", boxShadow: "0 0 10px color-mix(in srgb, var(--accent) 50%, transparent)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                <span className="relative z-10">{icons[item.iconKey]}</span>
                <div className="relative z-10 flex-1 min-w-0">
                  <span className="text-sm font-medium block">{item.label}</span>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-gray-500 block"
                    >
                      {item.desc}
                    </motion.span>
                  )}
                </div>

                {/* Notification dot for active */}
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full relative z-10"
                    style={{ background: "var(--accent)", boxShadow: "0 0 6px color-mix(in srgb, var(--accent) 50%, transparent)" }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-3">
        {/* Accent color picker */}
        <div className="px-1">
          <div className="text-[10px] text-gray-700 uppercase tracking-widest mb-2">Accent Color</div>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_PRESETS.map(p => (
              <button key={p.value} onClick={() => setAccent(p.value)} title={p.name}
                className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                style={{ background: p.value, border: accent === p.value ? `2px solid white` : `2px solid transparent`, boxShadow: accent === p.value ? `0 0 8px ${p.value}` : "none" }} />
            ))}
          </div>
        </div>
        <div className="mx-1 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />

        {/* 🌤️ Money Weather */}
        {weather ? (() => {
          const PARTICLES = Array.from({ length: weather.condition === "storm" ? 14 : weather.condition === "rainy" ? 10 : weather.condition === "sunny" ? 6 : 4 }, (_, i) => i);
          return (
            <div className="rounded-xl overflow-hidden relative" style={{ background: `linear-gradient(160deg, ${weather.skyA} 0%, ${weather.skyB} 100%)`, border: `1px solid ${weather.particleColor}25` }}>

              {/* Ambient particle layer */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {PARTICLES.map(i => (
                  <motion.div key={i}
                    className="absolute rounded-full"
                    style={{
                      width:  weather.condition === "rainy" || weather.condition === "storm" ? 1.5 : 3,
                      height: weather.condition === "rainy" || weather.condition === "storm" ? 8   : 3,
                      background: weather.particleColor,
                      opacity: 0.35,
                      left: `${(i / PARTICLES.length) * 100 + Math.random() * 10}%`,
                      top: "-10%",
                    }}
                    animate={{
                      y: weather.condition === "sunny"
                        ? [0, -8, 0]
                        : ["0%", "120%"],
                      opacity: weather.condition === "sunny"
                        ? [0.15, 0.6, 0.15]
                        : [0.5, 0],
                    }}
                    transition={{
                      duration: weather.condition === "storm" ? 0.7 + i * 0.08 : weather.condition === "sunny" ? 2.5 + i * 0.3 : 1.2 + i * 0.15,
                      repeat: Infinity,
                      delay: i * 0.18,
                      ease: "linear",
                    }}
                  />
                ))}
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-3 pt-2.5 pb-0 relative">
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: weather.particleColor }}>Money Weather</span>
                <span className="text-[9px] text-gray-600">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
              </div>

              {/* Main display */}
              <div className="flex items-center gap-3 px-3 pt-2 pb-1 relative">
                {/* Big weather emoji */}
                <motion.div
                  className="text-4xl leading-none shrink-0"
                  animate={{
                    y:       weather.condition === "sunny" ? [0, -3, 0] : weather.condition === "storm" ? [0, 2, -2, 0] : [0, -2, 0],
                    rotate:  weather.condition === "storm" ? [-3, 3, -3] : [0, 0, 0],
                    scale:   weather.condition === "sunny" ? [1, 1.06, 1] : [1, 1, 1],
                  }}
                  transition={{ duration: weather.condition === "storm" ? 0.5 : 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {weather.emoji}
                </motion.div>

                {/* Right info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-black text-white leading-tight">{weather.label}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5 leading-snug">{weather.forecast}</p>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-2 px-3 pb-2.5 pt-1 relative">
                {/* Health temp */}
                <div className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[8px] text-gray-600 uppercase tracking-wider">Health</p>
                  <motion.p
                    className="text-[14px] font-black leading-none mt-0.5"
                    style={{ color: healthNum >= 75 ? "#10B981" : healthNum >= 55 ? "#F59E0B" : "#E50914" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    {healthNum}<span className="text-[9px] font-normal text-gray-600">/100</span>
                  </motion.p>
                </div>
                {/* Budget usage */}
                <div className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[8px] text-gray-600 uppercase tracking-wider">Budget</p>
                  <motion.p
                    className="text-[14px] font-black leading-none mt-0.5"
                    style={{ color: budgetPct < 70 ? "#10B981" : budgetPct < 90 ? "#F59E0B" : "#E50914" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    {budgetPct}<span className="text-[9px] font-normal text-gray-600">%</span>
                  </motion.p>
                </div>
                {/* Outlook dot */}
                <div className="flex-1 rounded-lg px-2 py-1.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[8px] text-gray-600 uppercase tracking-wider">Outlook</p>
                  <motion.div className="flex items-center justify-center mt-1.5">
                    <motion.div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: weather.particleColor, boxShadow: `0 0 8px ${weather.particleColor}80` }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 1.8, repeat: Infinity }} />
                  </motion.div>
                </div>
              </div>
            </div>
          );
        })() : (
          <div className="rounded-xl px-3 py-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <motion.div className="text-2xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>🌐</motion.div>
            <p className="text-[9px] text-gray-700 mt-1">Checking forecast...</p>
          </div>
        )}
        <div className="mx-1 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 transition-all duration-300 group"
          style={{ ['--logout-hover' as string]: 'var(--accent)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)'; (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, var(--accent) 8%, transparent)`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = ''; (e.currentTarget as HTMLElement).style.background = ''; }}
        >
          <span className="transition-colors">{icons.logout}</span>
          <span className="text-sm font-medium">Logout</span>
        </motion.button>
      </div>
    </motion.aside>
  );
}
