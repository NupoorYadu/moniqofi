"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { awardXP } from "../lib/xp";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import AnimatedCard, {
  GlowingOrb,
  StaggerContainer,
  StaggerItem,
} from "../components/AnimatedCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const Scene3D = lazy(() => import("../components/Scene3D"));
const FeatureCard3D = lazy(() => import("../components/FeatureCard3D"));
import AnimatedBackground from "../components/AnimatedBackground";
import { GaugeChart, RankingBars, Sparkline } from "../components/ChartWidgets";
import { useToast } from "../context/ToastContext";
import CategoryDrillDown from "../components/CategoryDrillDown";
import AchievementBadges from "../components/AchievementBadges";
import FinancialDNA from "../components/FinancialDNA";

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/* Animated number counter */
function CountUp({ value, prefix = "", className = "" }: { value: number; prefix?: string; className?: string }) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const start = performance.now();
    const dur = 1800;
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay((eased * value).toLocaleString("en-IN", { maximumFractionDigits: 0 }));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <motion.span className={className} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{prefix}{display}</motion.span>;
}

/* Custom chart tooltip */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-semibold text-white">₹{Number(p.value).toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("expense");
  const [category, setCategory] = useState("");
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editType, setEditType] = useState("expense");
  const [editCategory, setEditCategory] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [budgetSuggestions, setBudgetSuggestions] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const { success, error, warning, info } = useToast();
  const [drillCategory, setDrillCategory] = useState<string | null>(null);
  const [dnaOpen, setDnaOpen] = useState(false);
  const [personalityType, setPersonalityType] = useState("Balanced");
  const [budgetPeriod, setBudgetPeriod] = useState(30);
  const [customDays, setCustomDays] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const PERIOD_OPTIONS = [
    { label: "7D", days: 7 },
    { label: "14D", days: 14 },
    { label: "1M", days: 30 },
    { label: "2M", days: 60 },
    { label: "3M", days: 90 },
    { label: "6M", days: 180 },
    { label: "1Y", days: 365 },
  ];

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    const [summaryRes, categoryRes, transactionRes, trendRes, insightsRes, budgetRes] =
      await Promise.all([
        fetch(`${API}/api/transactions/summary`, { headers }),
        fetch(`${API}/api/transactions/categories`, { headers }),
        fetch(`${API}/api/transactions?page=1&limit=10`, { headers }),
        fetch(`${API}/api/transactions/monthly-trend`, { headers }),
        fetch(`${API}/api/transactions/insights`, { headers }),
        fetch(`${API}/api/budgets/status?days=${budgetPeriod}`, { headers }),
      ]);
    setSummary(await summaryRes.json());
    setCategories(await categoryRes.json());
    const txnData = await transactionRes.json();
    setTransactions(txnData.transactions);
    setMonthlyTrend(await trendRes.json());
    setInsights(await insightsRes.json());
    setBudgetStatus(await budgetRes.json());

    fetch(`${API}/api/health-score`, { headers }).then((r) => r.json()).then(setHealthScore).catch(() => {});
    fetch(`${API}/api/budgets/suggest`, { headers }).then((r) => r.json()).then(setBudgetSuggestions).catch(() => {});
    fetch(`${API}/api/auth/me`, { headers }).then((r) => r.json()).then((u) => u.name && setUserName(u.name)).catch(() => {});
    fetch(`${API}/api/personality`, { headers }).then(r => r.json()).then(d => d.personalityType && setPersonalityType(d.personalityType)).catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchDashboardData();
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/budgets/status?days=${budgetPeriod}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((d) => {
        setBudgetStatus(d);
        // Award XP when all budgets are under 80% — user is managing money well
        if (d?.budgets?.length > 0 && d.budgets.every((b: any) => (b.percentage ?? 0) < 80)) {
          awardXP("budget_on_track", 30);
        }
      })
      .catch(() => {});
  }, [budgetPeriod]);

  const addTransaction = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, amount: Number(amount), type, category }),
    });
    if (res.ok) { setTitle(""); setAmount(""); setType("expense"); setCategory(""); await fetchDashboardData(); awardXP("transaction_logged", 10); success("Transaction added!", "Done"); }
    else { const data = await res.json(); error(data.message || "Failed to add transaction", "Error"); }
  };

  const addBudget = async () => {
    const token = localStorage.getItem("token");
    if (!budgetCategory || !budgetAmount) { warning("Category and amount are required", "Missing fields"); return; }
    const res = await fetch(`${API}/api/budgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category: budgetCategory, amount: Number(budgetAmount) }),
    });
    if (res.ok) { setBudgetCategory(""); setBudgetAmount(""); await fetchDashboardData(); success("Budget created!", "Done"); }
    else { const data = await res.json(); error(data.message || "Failed to set budget", "Error"); }
  };

  const deleteBudget = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/budgets/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await fetchDashboardData();
  };

  const deleteTransaction = async (id: string) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/api/transactions/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await fetchDashboardData();
  };

  const openEditModal = (t: any) => {
    setEditId(t.id); setEditTitle(t.title); setEditAmount(String(t.amount));
    setEditType(t.type); setEditCategory(t.category); setEditModal(true);
  };
  const closeEditModal = () => { setEditModal(false); setEditId(""); };

  const updateTransaction = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/transactions/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: editTitle, amount: Number(editAmount), type: editType, category: editCategory }),
    });
    if (res.ok) { closeEditModal(); await fetchDashboardData(); success("Transaction updated!", "Saved"); }
    else { const data = await res.json(); error(data.message || "Update failed", "Error"); }
  };

  if (!summary) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full" />
        </main>
      </div>
    );
  }

  const PIE_COLORS = ["#E50914", "#ff4555", "#B20710", "#831010", "#ff6b7a", "#a0a0a0", "#666"];

  const radarData = categories.slice(0, 6).map((c) => ({
    category: c.category,
    amount: parseFloat(c.total) || 0,
    fullMark: Math.max(...categories.map((x: any) => parseFloat(x.total) || 0), 1),
  }));

  const budgetBarData = budgetStatus?.budgets?.map((b: any) => ({
    name: b.category,
    spent: parseFloat(b.spent) || 0,
    budget: parseFloat(b.budgetAmount) || 0,
  })).filter((b: any) => b.budget > 0 || b.spent > 0) || [];

  const incomeExpenseDonut = [
    { name: "Income", value: summary.totalIncome, color: "#10B981" },
    { name: "Expense", value: summary.totalExpense, color: "#E50914" },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] relative overflow-hidden">
        <Suspense fallback={null}><Scene3D /></Suspense>
        <AnimatedBackground />
        <GlowingOrb color="#E50914" size={400} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#831010" size={300} bottom="10%" left="-5%" delay={2} />
        <GlowingOrb color="#B20710" size={250} top="40%" right="20%" delay={4} />

        <div className="relative z-10 p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white">
                  {userName ? <>Welcome back, <span className="gradient-text">{userName.split(" ")[0]}</span></> : <span className="gradient-text">Dashboard</span>}
                </h1>
                <p className="text-gray-500 mt-2 text-sm">Your financial overview at a glance</p>
              </div>
              {userName && (
                <div className="flex items-center gap-3">
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                    onClick={() => setDnaOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg, rgba(229,9,20,0.25), rgba(99,102,241,0.25))", border: "1px solid rgba(229,9,20,0.3)" }}>
                    <span className="text-base">🧬</span> My DNA
                  </motion.button>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}
                    className="w-12 h-12 rounded-full bg-linear-to-br from-[#E50914] to-[#B20710] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-[#E50914]/20">
                    {userName.charAt(0).toUpperCase()}
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Summary Cards */}
          <StaggerContainer className="grid grid-cols-3 gap-6 mb-8">
            {(() => {
              const savingsRate = summary.totalIncome > 0
                ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
                : 0;
              const expenseRatio = summary.totalIncome > 0
                ? Math.round((summary.totalExpense / summary.totalIncome) * 100)
                : 0;

              const cards = [
                {
                  label: "Total Income",
                  sub: "All time",
                  value: summary.totalIncome,
                  badge: `${100 - expenseRatio}% kept`,
                  badgeColor: "#10B981",
                  color: "#10B981",
                  sparkData: monthlyTrend.map((m: any) => parseFloat(m.income) || 0),
                  iconPath: "M12 2v20M17 7l-5-5-5 5",
                  bg: "radial-gradient(ellipse at 85% 10%, rgba(16,185,129,0.13) 0%, transparent 60%)",
                  border: "rgba(16,185,129,0.14)",
                },
                {
                  label: "Total Expense",
                  sub: "All time",
                  value: summary.totalExpense,
                  badge: `${expenseRatio}% of income`,
                  badgeColor: "#E50914",
                  color: "#E50914",
                  sparkData: monthlyTrend.map((m: any) => parseFloat(m.expense) || 0),
                  iconPath: "M12 22V2M17 17l-5 5-5-5",
                  bg: "radial-gradient(ellipse at 85% 10%, rgba(229,9,20,0.13) 0%, transparent 60%)",
                  border: "rgba(229,9,20,0.14)",
                },
                {
                  label: "Net Balance",
                  sub: "Income − Expense",
                  value: summary.balance,
                  badge: `${savingsRate}% savings rate`,
                  badgeColor: "#6366F1",
                  color: "#6366F1",
                  sparkData: monthlyTrend.map((m: any) => (parseFloat(m.income) || 0) - (parseFloat(m.expense) || 0)),
                  iconPath: "M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4Z",
                  bg: "radial-gradient(ellipse at 85% 10%, rgba(99,102,241,0.13) 0%, transparent 60%)",
                  border: "rgba(99,102,241,0.14)",
                },
              ];

              return cards.map((card, i) => (
                <StaggerItem key={i}>
                  <AnimatedCard delay={i * 0.1}>
                    <div
                      className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-0"
                      style={{
                        background: `#0f0f0f`,
                        border: `1px solid ${card.border}`,
                        boxShadow: `0 0 0 1px ${card.border}, 0 8px 40px rgba(0,0,0,0.4)`,
                      }}
                    >
                      {/* Radial color wash */}
                      <div className="absolute inset-0 pointer-events-none" style={{ background: card.bg }} />
                      {/* Top-right corner accent */}
                      <div
                        className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at top right, ${card.color}20 0%, transparent 70%)`,
                        }}
                      />

                      {/* Top row: icon badge + label */}
                      <div className="relative flex items-start justify-between mb-4">
                        <div>
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                            style={{
                              background: `${card.color}18`,
                              border: `1px solid ${card.color}30`,
                              boxShadow: `0 0 16px ${card.color}25`,
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={card.iconPath} />
                            </svg>
                          </div>
                          <div className="text-[10px] uppercase tracking-[.2em] text-gray-600 font-semibold">{card.sub}</div>
                          <div className="text-sm font-semibold text-gray-400 mt-0.5">{card.label}</div>
                        </div>
                        {/* Badge */}
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-full mt-1"
                          style={{
                            color: card.badgeColor,
                            background: `${card.badgeColor}15`,
                            border: `1px solid ${card.badgeColor}30`,
                          }}
                        >
                          {card.badge}
                        </motion.div>
                      </div>

                      {/* Main number */}
                      <CountUp
                        value={card.value}
                        prefix="₹ "
                        className="text-4xl font-black text-white relative tracking-tight leading-none mb-1"
                      />
                      {/* Subtle glow under number */}
                      <div className="h-px w-16 mb-4 rounded-full" style={{ background: `linear-gradient(to right, ${card.color}60, transparent)` }} />

                      {/* Sparkline spanning full bottom */}
                      {card.sparkData.length > 1 && (
                        <div className="relative -mx-5 -mb-5 mt-auto">
                          <Sparkline
                            data={card.sparkData}
                            color={card.color}
                            width={320}
                            height={48}
                          />
                          {/* Fade overlay at top of sparkline */}
                          <div
                            className="absolute top-0 left-0 right-0 h-6 pointer-events-none"
                            style={{ background: `linear-gradient(to bottom, #0f0f0f, transparent)` }}
                          />
                        </div>
                      )}
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              ));
            })()}
          </StaggerContainer>

          {/* Health Score + Income vs Expense */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {healthScore && (() => {
              const sc = healthScore.score;
              const scoreColor = sc >= 80 ? "#10B981" : sc >= 60 ? "#F59E0B" : "#E50914";
              const CIRC = 2 * Math.PI * 50;
              const ecg = "M0,30 L8,30 L12,30 L15,22 L17,38 L19,10 L21,48 L23,25 L28,30 L40,30";
              return (
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <Link href="/health-score">
                  <AnimatedCard className="relative overflow-hidden p-0 rounded-2xl dark-card animate-glow-pulse cursor-pointer group">
                    {/* Background ECG pulse */}
                    <div className="absolute inset-0 opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500">
                      <svg viewBox="0 0 400 60" className="w-full h-full" preserveAspectRatio="none">
                        {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360].map((offset, i) => (
                          <motion.path key={i} d={ecg} fill="none" stroke={scoreColor} strokeWidth="1.5" strokeLinecap="round"
                            style={{ transform: `translateX(${offset}px)` }}
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: [0, 0.8, 0] }}
                            transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, repeatDelay: 0 }} />
                        ))}
                      </svg>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${scoreColor}08 0%, transparent 50%, ${scoreColor}04 100%)` }} />

                    <div className="relative z-10 p-6">
                      <div className="flex items-center gap-6">
                        {/* Score Ring — dynamic color */}
                        <div className="relative shrink-0">
                          <svg width="120" height="120" className="-rotate-90">
                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                            <motion.circle cx="60" cy="60" r="50" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                              strokeDasharray={CIRC}
                              initial={{ strokeDashoffset: CIRC }}
                              animate={{ strokeDashoffset: CIRC * (1 - sc / 100) }}
                              transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
                              style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }} />
                            {/* Secondary glow ring */}
                            <motion.circle cx="60" cy="60" r="42" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 42}
                              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - sc / 100) }}
                              transition={{ duration: 2, delay: 0.8, ease: "easeOut" }}
                              opacity={0.25} />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span className="text-3xl font-bold glow-text" style={{ color: scoreColor }}
                              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring" }}>
                              {sc}
                            </motion.span>
                            <span className="text-gray-500 text-xs">/100</span>
                          </div>
                        </div>

                        {/* Info section */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex flex-col gap-0.5">
                              <span className="uppercase text-[10px] tracking-widest text-gray-500 font-semibold">Wellness Check</span>
                              <h2 className="text-xl font-bold text-white">Financial Health</h2>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <motion.span
                              className="text-sm font-bold px-3 py-1 rounded-full shadow-lg border border-red-500/30 bg-red-900/70 text-red-200 flex items-center gap-1"
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1.1 }}
                              transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                            >
                              <motion.span
                                initial={{ opacity: 0.7 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
                                className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse mr-1"
                              />
                              Grade {healthScore.grade}
                            </motion.span>
                            <span className="text-xs text-gray-500">
                              {sc >= 80 ? "Excellent" : sc >= 60 ? "Good shape" : sc >= 40 ? "Needs attention" : "Needs work"}
                            </span>
                          </div>

                          {/* Mini breakdown bars */}
                          {healthScore.breakdown && (
                            <div className="mt-3 space-y-1.5">
                              {healthScore.breakdown.slice(0, 3).map((b: { label: string; score: number; max: number }, i: number) => {
                                const pct = Math.round((b.score / b.max) * 100);
                                const barColors = ["#E50914", "#6366F1", "#F59E0B", "#10B981", "#ff4555"];
                                const c = barColors[i % barColors.length];
                                return (
                                  <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: i * 0.2 }}>
                                    <span className="text-[10px] text-gray-500 w-16 truncate">{b.label}</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                      <motion.div className="h-full rounded-full" style={{ background: c }}
                                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                        transition={{ duration: 1.5, delay: 1 + i * 0.15, ease: "easeOut" }} />
                                    </div>
                                    <span className="text-[10px] font-medium" style={{ color: c }}>{b.score}/{b.max}</span>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bottom CTA hint */}
                      <div className="mt-4 pt-3 border-t border-white/4 flex items-center justify-between">
                        <span className="text-[11px] text-gray-600 group-hover:text-red-400 transition-colors duration-300">Tap to see full breakdown</span>
                        <motion.svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </motion.svg>
                      </div>
                    </div>
                  </AnimatedCard>
                </Link>
              </motion.div>
              );
            })()}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <AnimatedCard className="p-6 rounded-2xl dark-card h-full">
                <h2 className="text-lg font-semibold text-white mb-4">Income vs Expense</h2>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={incomeExpenseDonut} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" animationDuration={1500}>
                      {incomeExpenseDonut.map((entry, i) => (
                        <Cell key={i} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}50)` }} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(8px)" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </AnimatedCard>
            </motion.div>
          </div>

          {/* Quick Access — AI Features */}
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="w-1 h-6 rounded-full bg-[#E50914]" />
            AI-Powered Features
          </h2>
          <div className="grid grid-cols-4 gap-6 mb-8 -mx-1 px-1 py-2" style={{ perspective: "1200px" }}>
            <Suspense fallback={<div className="col-span-4 h-48 flex items-center justify-center"><div className="w-8 h-8 rounded-full bg-red-500/20 animate-pulse" /></div>}>
              {([
                { href: "/personality", label: "Personality", sub: "Decode your money behavior with AI-driven trait analysis", color: "#E50914", scene: "personality" as const, stat: "5 traits" },
                { href: "/simulation", label: "Future You", sub: "Crystal-ball projection of your wealth trajectory", color: "#6366F1", scene: "simulation" as const, stat: "30yr model" },
                { href: "/subscriptions", label: "Subscriptions", sub: "Hunt down hidden recurring charges draining your wallet", color: "#F59E0B", scene: "subscriptions" as const, stat: "Leak score" },
                { href: "/coach", label: "AI Coach", sub: "Neural-powered financial advisor at your fingertips", color: "#10B981", scene: "coach" as const, stat: "Ask anything" },
              ]).map((item, i) => (
                <Link key={i} href={item.href} className="block">
                  <FeatureCard3D {...item} index={i} />
                </Link>
              ))}
            </Suspense>
          </div>

          {/* Financial Pulse — gauge strip */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
            <AnimatedCard className="dark-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" /> Financial Pulse
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <GaugeChart
                  value={summary.totalIncome > 0 ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100) : 0}
                  label="Savings Rate"
                  color="#10B981"
                  size={150}
                />
                <GaugeChart
                  value={budgetStatus?.budgets?.length > 0
                    ? Math.round(budgetStatus.budgets.reduce((s: number, b: any) => s + (b.percentage || 0), 0) / budgetStatus.budgets.length)
                    : 0}
                  label="Budget Usage"
                  color={budgetStatus?.budgets?.some((b: any) => b.percentage > 90) ? "#E50914" : "#6366F1"}
                  size={150}
                />
                <GaugeChart
                  value={healthScore?.score || 0}
                  label="Health Score"
                  color="#E50914"
                  size={150}
                />
                <GaugeChart
                  value={categories.length > 0 ? Math.min(categories.length * 15, 100) : 0}
                  label="Diversification"
                  sublabel={`${categories.length} categories`}
                  color="#F59E0B"
                  size={150}
                />
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Smart Insights */}
          {insights.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
              <AnimatedCard className="dark-card p-6 rounded-2xl">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">Smart Insights</h2>
                <div className="grid gap-3">
                  {insights.map((insight: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }}
                      className={`flex items-center gap-3 p-4 rounded-xl ${insight.type === "warning" ? "bg-[#E50914]/10 border border-[#E50914]/20" : "bg-white/3 border border-white/6"}`}>
                      <span className="text-xl">{insight.icon}</span>
                      <p className="text-gray-300 text-sm">{insight.text}</p>
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
            </motion.div>
          )}

          {/* Add Transaction */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
            <AnimatedCard className="dark-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-white">Add Transaction</h2>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="dark-input p-3 rounded-xl" />
                <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="dark-input p-3 rounded-xl" />
                <select value={type} onChange={(e) => setType(e.target.value)} className="dark-input p-3 rounded-xl">
                  <option value="expense">Expense</option><option value="income">Income</option>
                </select>
                <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="dark-input p-3 rounded-xl" />
              </div>
              <button onClick={addTransaction} className="mt-4 netflix-btn px-6 py-3 rounded-xl">Add</button>
            </AnimatedCard>
          </motion.div>

          {/* Top Spending Categories — ranking bars */}
          {categories.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="mb-8">
              <AnimatedCard className="dark-card p-6 rounded-2xl">
                <h2 className="text-lg font-semibold text-white mb-5">Top Spending Categories</h2>
                <RankingBars
                  data={categories.slice(0, 6).map((c: any, i: number) => ({
                    label: c.category,
                    value: parseFloat(c.total) || 0,
                    color: PIE_COLORS[i % PIE_COLORS.length],
                  }))}
                  onItemClick={(label) => setDrillCategory(label)}
                />
              </AnimatedCard>
            </motion.div>
          )}

          {/* Charts: Monthly Trend + Pie */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <AnimatedCard className="chart-container rounded-2xl">
                <h2 className="text-lg font-semibold mb-4 text-white">Monthly Trend</h2>
                <ResponsiveContainer width="100%" height={280}>
                  {monthlyTrend.length <= 2 ? (
                    <BarChart data={monthlyTrend.map((m: any) => ({ month: m.month, Income: parseFloat(m.income) || 0, Expense: parseFloat(m.expense) || 0 }))} barGap={8}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} /><stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E50914" stopOpacity={0.9} /><stop offset="100%" stopColor="#E50914" stopOpacity={0.4} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 11 }} /><YAxis stroke="#555" tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} /><Legend />
                      <Bar dataKey="Income" fill="url(#incomeGradient)" radius={[8, 8, 0, 0]} animationDuration={1500} barSize={40} />
                      <Bar dataKey="Expense" fill="url(#expenseGradient)" radius={[8, 8, 0, 0]} animationDuration={1500} barSize={40} />
                    </BarChart>
                  ) : (
                    <AreaChart data={monthlyTrend.map((m: any) => ({ month: m.month, Income: parseFloat(m.income) || 0, Expense: parseFloat(m.expense) || 0 }))}>
                      <defs>
                        <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E50914" stopOpacity={0.3} /><stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 11 }} /><YAxis stroke="#555" tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} /><Legend />
                      <Area type="monotone" dataKey="Income" stroke="#10B981" fill="url(#incomeGradient)" strokeWidth={2} animationDuration={2000} dot={{ r: 4, fill: "#10B981", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#10B981", stroke: "#0A0A0A", strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="Expense" stroke="#E50914" fill="url(#expenseGradient)" strokeWidth={2} animationDuration={2000} dot={{ r: 4, fill: "#E50914", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#E50914", stroke: "#0A0A0A", strokeWidth: 2 }} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </AnimatedCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <AnimatedCard className="chart-container rounded-2xl">
                <h2 className="text-lg font-semibold mb-4 text-white">Expense Breakdown</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categories.map((c: any) => ({ name: c.category, value: parseFloat(c.total) }))} cx="50%" cy="50%" outerRadius={100} innerRadius={40} paddingAngle={3} dataKey="value" animationDuration={1500}
                      onClick={(d: any) => setDrillCategory(d.name)}
                      style={{ cursor: "pointer" }}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                      {categories.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} style={{ filter: `drop-shadow(0 0 4px ${PIE_COLORS[i % PIE_COLORS.length]}50)` }} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </AnimatedCard>
            </motion.div>
          </div>

          {/* Charts: Radar + Budget Bars */}
          {(radarData.length > 0 || budgetBarData.length > 0) && (
          <div className={`grid ${radarData.length > 0 && budgetBarData.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} gap-6 mb-8`}>
            {radarData.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9 }}>
                <AnimatedCard className="chart-container rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 text-white">Spending Radar</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: "#888", fontSize: 11 }} />
                      <PolarRadiusAxis tick={{ fill: "#555", fontSize: 9 }} />
                      <Radar name="Spending" dataKey="amount" stroke="#E50914" fill="#E50914" fillOpacity={0.2} animationDuration={2000}
                        dot={{ r: 3, fill: "#E50914", stroke: "#E50914" }} />
                      <Tooltip content={<ChartTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </AnimatedCard>
              </motion.div>
            )}
            {budgetBarData.length > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }}>
                <AnimatedCard className="chart-container rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 text-white">Budget vs Spent</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={budgetBarData} barGap={4} barCategoryGap="30%">
                      <defs>
                        <linearGradient id="spentBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#E50914" /><stop offset="100%" stopColor="#B20710" />
                        </linearGradient>
                        <linearGradient id="budgetBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4b5563" /><stop offset="100%" stopColor="#374151" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#555" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#555" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend />
                      <Bar dataKey="budget" fill="url(#budgetBarGrad)" radius={[6, 6, 0, 0]} animationDuration={1500} name="Budget" />
                      <Bar dataKey="spent" fill="url(#spentBarGrad)" radius={[6, 6, 0, 0]} animationDuration={1500} name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                </AnimatedCard>
              </motion.div>
            )}
          </div>
          )}

          {/* ── Net Worth Timeline + Spending Forecast ── */}
          {monthlyTrend.length > 0 && (() => {
            // Compute cumulative net worth
            let cum = 0;
            const netWorthData = monthlyTrend.map((m: any) => {
              cum += (parseFloat(m.income) || 0) - (parseFloat(m.expense) || 0);
              return { month: m.month, netWorth: Math.round(cum), income: parseFloat(m.income) || 0, expense: parseFloat(m.expense) || 0 };
            });
            // Spending forecast: avg last 3 months spend, project remaining days in month
            const last3 = monthlyTrend.slice(-3);
            const avgMonthlySpend = last3.reduce((s: number, m: any) => s + (parseFloat(m.expense) || 0), 0) / (last3.length || 1);
            const today = new Date();
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            const dayOfMonth = today.getDate();
            const spentSoFar = parseFloat(monthlyTrend[monthlyTrend.length - 1]?.expense) || 0;
            const projectedTotal = Math.round(spentSoFar + (avgMonthlySpend / daysInMonth) * (daysInMonth - dayOfMonth));
            const overBudget = projectedTotal > avgMonthlySpend;
            const diff = Math.abs(projectedTotal - Math.round(avgMonthlySpend));
            const pct = Math.round((dayOfMonth / daysInMonth) * 100);

            return (
              <div className="grid grid-cols-3 gap-6 mb-8">
                {/* Net Worth Timeline */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                  className="col-span-2 rounded-2xl overflow-hidden p-6" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.18)", border: "1px solid rgba(99,102,241,0.3)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 uppercase tracking-widest">Cumulative</div>
                      <div className="text-sm font-bold text-white">Net Worth Timeline</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">Current</div>
                      <div className="text-base font-black" style={{ color: netWorthData[netWorthData.length-1]?.netWorth >= 0 ? "#10B981" : "#E50914" }}>
                        ₹{(netWorthData[netWorthData.length-1]?.netWorth || 0).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={netWorthData}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366F1" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#555" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-xl">
                            <p className="text-white font-semibold text-sm mb-1">{d.month}</p>
                            <p className="text-indigo-400 text-xs">Net Worth: ₹{d.netWorth.toLocaleString("en-IN")}</p>
                          </div>
                        );
                      }} />
                      <Area type="monotone" dataKey="netWorth" stroke="#6366F1" strokeWidth={2} fill="url(#nwGrad)"
                        dot={{ r: 3, fill: "#6366F1", stroke: "#6366F1" }} animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Spending Forecast */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
                  className="rounded-2xl overflow-hidden p-6 flex flex-col" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.18)", border: "1px solid rgba(245,158,11,0.3)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-600 uppercase tracking-widest">AI Forecast</div>
                      <div className="text-sm font-bold text-white">Month-End Spend</div>
                    </div>
                  </div>

                  {/* Big number */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                    <div>
                      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Projected Total</div>
                      <div className="text-3xl font-black" style={{ color: overBudget ? "#E50914" : "#10B981" }}>
                        ₹{projectedTotal.toLocaleString("en-IN")}
                      </div>
                      <div className="text-xs mt-1" style={{ color: overBudget ? "#E50914" : "#10B981" }}>
                        {overBudget ? `▲ ₹${diff.toLocaleString("en-IN")} over avg` : `▼ ₹${diff.toLocaleString("en-IN")} under avg`}
                      </div>
                    </div>

                    {/* Month progress bar */}
                    <div className="w-full">
                      <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                        <span>Day {dayOfMonth}</span><span>Day {daysInMonth}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <motion.div className="h-full rounded-full" style={{ background: overBudget ? "#E50914" : "#10B981" }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeOut" }} />
                      </div>
                      <div className="text-[10px] text-gray-600 mt-1 text-center">{pct}% of month elapsed</div>
                    </div>

                    {/* Avg ref */}
                    <div className="w-full px-3 py-2 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="text-[10px] text-gray-600 mb-0.5">3-month avg spend</div>
                      <div className="text-sm font-bold text-gray-300">₹{Math.round(avgMonthlySpend).toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {/* Achievements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }} className="mb-8">
            <AchievementBadges
              transactions={transactions}
              summary={summary}
              budgetStatus={budgetStatus}
              healthScore={healthScore?.score}
            />
          </motion.div>

          {/* Budget System */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mb-8">
            <AnimatedCard className="dark-card p-6 rounded-2xl">
              {/* Header + period selector */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-white">Budgets</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Spending vs your set limits</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {PERIOD_OPTIONS.map(opt => (
                      <button key={opt.days} onClick={() => { setBudgetPeriod(opt.days); setShowCustomInput(false); setCustomDays(""); }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        style={budgetPeriod === opt.days && !showCustomInput ? { background: "var(--accent)", color: "white", boxShadow: `0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)` } : { color: "#666" }}>
                        {opt.label}
                      </button>
                    ))}
                    <button onClick={() => setShowCustomInput(v => !v)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={showCustomInput ? { background: "var(--accent)", color: "white", boxShadow: `0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)` } : { color: "#666" }}>
                      Custom
                    </button>
                  </div>
                  {showCustomInput && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="1" max="730" placeholder="Days (e.g. 45)"
                        value={customDays}
                        onChange={e => setCustomDays(e.target.value)}
                        className="dark-input text-xs px-3 py-1.5 rounded-lg w-36 text-white"
                        onKeyDown={e => { if (e.key === "Enter" && Number(customDays) > 0) { setBudgetPeriod(Number(customDays)); } }}
                      />
                      <button
                        onClick={() => { const d = Number(customDays); if (d > 0 && d <= 730) setBudgetPeriod(d); }}
                        disabled={!customDays || Number(customDays) <= 0 || Number(customDays) > 730}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                        style={{ background: customDays && Number(customDays) > 0 ? "var(--accent)" : "rgba(255,255,255,0.06)", color: "white" }}>
                        Apply
                      </button>
                      {showCustomInput && budgetPeriod && !PERIOD_OPTIONS.find(o => o.days === budgetPeriod) && (
                        <span className="text-[11px] text-gray-500">{budgetPeriod}d active</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mb-6">
                <input type="text" placeholder="Category" value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)} className="dark-input p-3 rounded-xl flex-1" />
                <input type="number" placeholder="Amount" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="dark-input p-3 rounded-xl w-40" />
                <button onClick={addBudget} className="netflix-btn px-4 py-3 rounded-xl">Set Budget</button>
              </div>
              {budgetStatus?.budgets?.length > 0 ? (
                <div className="grid gap-4">
                  {budgetStatus.budgets.map((b: any, i: number) => (
                    <motion.div key={b.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className={`p-4 rounded-xl border ${b.status === "exceeded" ? "bg-[#E50914]/10 border-[#E50914]/20" : b.status === "warning" ? "bg-orange-900/10 border-orange-700/20" : "bg-white/2 border-white/6"}`}>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{b.category}</span>
                          {b.status === "exceeded" && <span className="text-xs bg-[#E50914] text-white px-2 py-0.5 rounded-full animate-pulse">OVER</span>}
                          {b.status === "warning" && <span className="text-xs bg-orange-600 text-white px-2 py-0.5 rounded-full">HIGH</span>}
                          <span className="text-[10px] text-gray-600">{b.transactionCount} txns</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm text-gray-300">₹{parseFloat(b.spent).toLocaleString("en-IN")} <span className="text-gray-600">/ ₹{parseFloat(b.budgetAmount).toLocaleString("en-IN")}</span></div>
                            {budgetPeriod > 30 && <div className="text-[10px] text-gray-600">Monthly: ₹{parseFloat(b.monthlyBudget).toLocaleString("en-IN")}</div>}
                          </div>
                          <button onClick={() => deleteBudget(b.id)} className="text-[#E50914] text-sm hover:underline">Remove</button>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                        <motion.div className={`h-2.5 rounded-full ${b.percentage >= 100 ? "bg-[#E50914]" : b.percentage >= 80 ? "bg-orange-500" : "bg-[#6366F1]"}`}
                          initial={{ width: 0 }} animate={{ width: `${Math.min(b.percentage, 100)}%` }} transition={{ duration: 1.5, delay: 0.3 + i * 0.1 }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>{b.percentage}% used</span>
                        {b.predictedOvershoot > 0 && <span className="text-[#E50914]">Over by ₹{b.predictedOvershoot.toLocaleString("en-IN")}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-sm">No budgets set yet.</p>}
            </AnimatedCard>
          </motion.div>

          {/* AI Budget Suggestions */}
          {budgetSuggestions?.suggestions?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mb-8">
              <AnimatedCard className="dark-card p-6 rounded-2xl border border-[#E50914]/10">
                <h2 className="text-xl font-semibold mb-2 text-white">AI Budget Suggestions</h2>
                <p className="text-sm text-gray-500 mb-4">{budgetSuggestions.message}</p>
                <div className="grid gap-3">
                  {budgetSuggestions.suggestions.map((s: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.1 }}
                      className="flex items-center justify-between glass-card p-4 rounded-xl">
                      <div>
                        <span className="font-semibold text-white">{s.category}</span>
                        <span className="text-sm text-gray-400 ml-2">Avg: ₹{s.avgMonthlySpend}/mo</span>
                      </div>
                      <button onClick={async () => {
                        const token = localStorage.getItem("token");
                        await fetch(`${API}/api/budgets`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ category: s.category, amount: s.suggestedBudget }) });
                        await fetchDashboardData();
                      }} className="netflix-btn px-4 py-2 rounded-lg text-xs">Set ₹{s.suggestedBudget}</button>
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
            </motion.div>
          )}

          {/* Transactions Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="mb-8">
            <AnimatedCard className="dark-card p-6 rounded-2xl">
              <h2 className="text-xl font-semibold mb-4 text-white">Recent Transactions</h2>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/6">
                    {["Title", "Amount", "Type", "Category", "Source", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left p-3 text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {transactions.map((t: any, i: number) => (
                      <motion.tr key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="border-b border-white/4 hover:bg-white/2 transition-colors">
                        <td className="p-3 text-gray-200">
                          <div className="flex items-center gap-2">
                            {t.title}
                            {t.merchant_name && t.merchant_name !== t.title && (
                              <span className="text-xs text-gray-500">({t.merchant_name})</span>
                            )}
                          </div>
                        </td>
                        <td className={`p-3 font-semibold ${t.type === "income" ? "text-emerald-400" : "text-[#E50914]"}`}>{t.type === "income" ? "+" : "-"}₹{t.amount}</td>
                        <td className="p-3 capitalize text-gray-300">{t.type}</td>
                        <td className="p-3 text-gray-300">{t.category}</td>
                        <td className="p-3">
                          {t.source === "bank" ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                              Bank
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-gray-500 text-xs font-medium">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button onClick={() => openEditModal(t)} className="bg-white/5 hover:bg-white/10 text-white px-3 py-1 rounded-lg text-sm transition">Edit</button>
                            <button onClick={() => setDeleteConfirm(t.id)} className="bg-[#E50914]/20 hover:bg-[#E50914]/40 text-[#E50914] px-3 py-1 rounded-lg text-sm transition">Delete</button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </AnimatedCard>
          </motion.div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="dark-card rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4 border border-white/8">
                <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-white">Edit Transaction</h2><button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl">&times;</button></div>
                <div className="grid gap-4">
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="dark-input w-full p-3 rounded-xl" placeholder="Title" />
                  <input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="dark-input w-full p-3 rounded-xl" placeholder="Amount" />
                  <select value={editType} onChange={(e) => setEditType(e.target.value)} className="dark-input w-full p-3 rounded-xl"><option value="expense">Expense</option><option value="income">Income</option></select>
                  <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="dark-input w-full p-3 rounded-xl" placeholder="Category" />
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={updateTransaction} className="flex-1 netflix-btn px-4 py-3 rounded-xl">Save</button>
                  <button onClick={closeEditModal} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Financial DNA Report Card */}
        <FinancialDNA
          open={dnaOpen}
          onClose={() => setDnaOpen(false)}
          userName={userName}
          healthScore={healthScore?.score ?? 0}
          personalityType={personalityType}
          topCategory={categories[0]?.category ?? "—"}
          topCategoryAmount={parseFloat(categories[0]?.total ?? "0")}
          savingsRate={summary ? (summary.totalIncome > 0 ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100 : 0) : 0}
          balance={summary?.balance ?? 0}
          totalIncome={summary?.totalIncome ?? 0}
          totalExpense={summary?.totalExpense ?? 0}
          insight={insights[0]?.message}
        />

        {/* Category Drill-Down Panel */}
        <CategoryDrillDown
          category={drillCategory}
          transactions={transactions}
          onClose={() => setDrillCategory(null)}
        />

        {/* Delete Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="dark-card rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
                <div className="text-center"><div className="w-12 h-12 rounded-full bg-[#E50914]/20 flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div><h2 className="text-xl font-bold mb-2 text-white">Delete Transaction?</h2><p className="text-gray-400 mb-6">This cannot be undone.</p></div>
                <div className="flex gap-3">
                  <button onClick={async () => { await deleteTransaction(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 netflix-btn px-4 py-3 rounded-xl">Delete</button>
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl transition">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
