"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AnimatedCard, {
  FloatingElement,
  GlowingOrb,
  StaggerContainer,
  StaggerItem,
} from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { SimulationHero, SectionDivider } from "../components/PageVisuals";
import { API_BASE } from "../lib/api";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ComposedChart,
  Line,
} from "recharts";

interface SimulationData {
  inputs: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
    annualReturn: number;
    years: number;
    currentBalance: number;
  };
  projections: {
    currentPath: { year: number; amount: number }[];
    optimizedPath: { year: number; amount: number }[];
    aggressivePath: { year: number; amount: number }[];
  };
  finalAmounts: {
    current: number;
    optimized: number;
    aggressive: number;
  };
  milestones: {
    target: number;
    label: string;
    monthsToReach: number;
    yearsToReach: string;
  }[];
  whatIf: {
    scenario: string;
    extraSavings: number;
    projectedGain: number;
  }[];
}

export default function Simulation() {
  const API = API_BASE;
  const [data, setData] = useState<SimulationData | null>(null);
  const [years, setYears] = useState("10");
  const [investmentReturn, setInvestmentReturn] = useState("8");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlySavings, setMonthlySavings] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const runSimulation = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const body: any = { years: Number(years), investmentReturn: Number(investmentReturn) };
      if (monthlyIncome) body.monthlyIncome = Number(monthlyIncome);
      if (monthlySavings) body.monthlySavings = Number(monthlySavings);
      const res = await fetch(`${API}/api/simulation/project`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    runSimulation();
  }, [router]);

  const chartData = data?.projections
    ? data.projections.currentPath.map((p, i) => ({
        year: `Year ${p.year}`,
        Current: p.amount,
        Optimized: data.projections.optimizedPath[i]?.amount || 0,
        Aggressive: data.projections.aggressivePath[i]?.amount || 0,
      }))
    : [];

  const milestoneBarData = data?.milestones.map((m) => ({
    name: m.label,
    years: parseFloat(m.yearsToReach),
    months: m.monthsToReach,
  })) || [];

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] relative overflow-hidden">
        <AnimatedBackground />
        <GlowingOrb color="#6366F1" size={400} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#E50914" size={300} bottom="10%" left="-5%" delay={2} />

        <div className="relative z-10 p-8">
          <SimulationHero />

          {/* Simulation Parameters */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
            <AnimatedCard className="dark-card p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <FloatingElement delay={0}><span className="text-2xl text-[#E50914]"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span></FloatingElement>
                Simulation Parameters
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Years</label>
                  <input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="dark-input p-3 rounded-xl w-full" placeholder="10" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Return %/year</label>
                  <input type="number" value={investmentReturn} onChange={(e) => setInvestmentReturn(e.target.value)} className="dark-input p-3 rounded-xl w-full" placeholder="8" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Monthly Income (opt)</label>
                  <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="dark-input p-3 rounded-xl w-full" placeholder="auto" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Monthly Savings (opt)</label>
                  <input type="number" value={monthlySavings} onChange={(e) => setMonthlySavings(e.target.value)} className="dark-input p-3 rounded-xl w-full" placeholder="auto" />
                </div>
              </div>
              <button onClick={runSimulation} disabled={loading} className="mt-4 netflix-btn px-8 py-3 rounded-xl flex items-center gap-2">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>Run Simulation</>
                )}
              </button>
            </AnimatedCard>
          </motion.div>

          {data && (
            <>
              {/* Current Stats */}
              <StaggerContainer className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Monthly Income", value: data.inputs.monthlyIncome, color: "#10B981", icon: "💰" },
                  { label: "Monthly Savings", value: data.inputs.monthlySavings, color: "#6366F1", icon: "📊" },
                  { label: "Current Balance", value: data.inputs.currentBalance, color: "#F59E0B", icon: "🏦" },
                  { label: "Return Rate", value: `${data.inputs.annualReturn}%`, color: "#E50914", isText: true, icon: "📈" },
                ].map((item, i) => (
                  <StaggerItem key={i}>
                    <AnimatedCard className="dark-card p-5 rounded-2xl" delay={i * 0.1}>
                      <FloatingElement delay={i * 0.2}>
                        <span className="text-2xl">{item.icon}</span>
                      </FloatingElement>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mt-3">{item.label}</p>
                      <p className="text-2xl font-bold mt-1" style={{ color: item.color }}>
                        {(item as any).isText ? item.value : `₹${Number(item.value).toLocaleString("en-IN")}`}
                      </p>
                    </AnimatedCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              <SectionDivider color="#6366F1" />

              {/* Final Amounts */}
              <StaggerContainer className="grid grid-cols-3 gap-6 mb-8">
                {[
                  { label: "Current Path", value: data.finalAmounts.current, color: "#666", desc: "If you continue as-is", icon: "📉" },
                  { label: "Optimized Path", value: data.finalAmounts.optimized, color: "#6366F1", desc: "10% expense reduction", icon: "📊" },
                  { label: "Aggressive Path", value: data.finalAmounts.aggressive, color: "#10B981", desc: "20% cuts + 12% returns", icon: "🚀" },
                ].map((item, i) => (
                  <StaggerItem key={i}>
                    <AnimatedCard className="p-6 rounded-2xl animate-glow-pulse" delay={i * 0.15}
                      style={{ background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)`, border: `1px solid ${item.color}20` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{item.label}</span>
                        <FloatingElement delay={i * 0.3}><span className="text-2xl">{item.icon}</span></FloatingElement>
                      </div>
                      <p className="text-3xl font-bold text-white">₹{item.value.toLocaleString("en-IN")}</p>
                      <p className="text-xs text-gray-500 mt-2">{item.desc}</p>
                      <div className="mt-3 h-1 rounded-full overflow-hidden bg-white/5">
                        <motion.div className="h-full rounded-full" style={{ background: item.color }}
                          initial={{ width: 0 }} animate={{ width: `${Math.min((item.value / data.finalAmounts.aggressive) * 100, 100)}%` }}
                          transition={{ duration: 2, delay: 0.5 + i * 0.2 }} />
                      </div>
                    </AnimatedCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>

              {/* Projection Chart */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
                <AnimatedCard className="chart-container rounded-2xl">
                  <h2 className="text-lg font-semibold mb-4 text-white">Wealth Projection ({data.inputs.years} years)</h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#666" stopOpacity={0.2} /><stop offset="95%" stopColor="#666" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradOptimized" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradAggressive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="year" stroke="#555" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#555" tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 10000000 ? `${(v / 10000000).toFixed(1)}Cr` : v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v) => typeof v === "number" ? `₹${v.toLocaleString("en-IN")}` : v} />
                      <Legend />
                      <Area type="monotone" dataKey="Aggressive" stroke="#10B981" fill="url(#gradAggressive)" strokeWidth={2} animationDuration={2000} dot={{ r: 3, fill: "#10B981" }} />
                      <Area type="monotone" dataKey="Optimized" stroke="#6366F1" fill="url(#gradOptimized)" strokeWidth={2} animationDuration={2000} dot={{ r: 3, fill: "#6366F1" }} />
                      <Area type="monotone" dataKey="Current" stroke="#666" fill="url(#gradCurrent)" strokeWidth={2} animationDuration={2000} dot={{ r: 3, fill: "#666" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </AnimatedCard>
              </motion.div>

              <SectionDivider color="#6366F1" />

              {/* Milestones */}
              {data.milestones.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
                  <AnimatedCard className="dark-card p-6 rounded-2xl">
                    <h2 className="text-lg font-semibold mb-4 text-white">Milestones Timeline</h2>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Milestone Bar Chart */}
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={milestoneBarData} layout="vertical" barSize={20}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis type="number" stroke="#555" tick={{ fontSize: 11 }} label={{ value: "Years", position: "insideBottom", offset: -5, fill: "#555" }} />
                          <YAxis type="category" dataKey="name" stroke="#555" tick={{ fontSize: 12, fill: "#ccc" }} width={60} />
                          <Tooltip formatter={(v) => typeof v === "number" ? `${v} years` : v} />
                          <Bar dataKey="years" radius={[0, 6, 6, 0]} animationDuration={1500}>
                            {milestoneBarData.map((_, i) => (
                              <Cell key={i} fill={["#E50914", "#6366F1", "#F59E0B", "#10B981", "#EC4899"][i % 5]}
                                style={{ filter: `drop-shadow(0 0 4px ${["#E50914", "#6366F1", "#F59E0B", "#10B981", "#EC4899"][i % 5]}40)` }} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>

                      {/* Milestone Cards */}
                      <div className="space-y-3">
                        {data.milestones.map((m, i) => {
                          const color = ["#E50914", "#6366F1", "#F59E0B", "#10B981", "#EC4899"][i % 5];
                          return (
                            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
                              className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}>
                                {m.label}
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">{m.label}</p>
                                <p className="text-gray-500 text-xs">{m.yearsToReach} years ({m.monthsToReach} months)</p>
                              </div>
                              <div className="text-right">
                                <motion.div className="w-16 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                  <motion.div className="h-full rounded-full" style={{ background: color }}
                                    initial={{ width: 0 }} animate={{ width: `${Math.min((parseFloat(m.yearsToReach) / Number(years)) * 100, 100)}%` }}
                                    transition={{ duration: 1.5, delay: 0.8 + i * 0.1 }} />
                                </motion.div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              )}

              {/* What-If Scenarios */}
              {data.whatIf.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-8">
                  <AnimatedCard className="dark-card p-6 rounded-2xl border border-[#6366F1]/10">
                    <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                      <FloatingElement delay={0}><span className="text-2xl text-gray-400"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span></FloatingElement>
                      What-If Scenarios
                    </h2>
                    <div className="grid gap-4">
                      {data.whatIf.map((w, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15 }}
                          className="glass-card p-5 rounded-xl">
                          <p className="text-gray-300 text-sm mb-3">{w.scenario}</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/[0.03] rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Extra Savings</p>
                              <p className="text-emerald-400 font-bold text-lg">₹{w.extraSavings.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="bg-white/[0.03] rounded-lg p-3">
                              <p className="text-xs text-gray-500 uppercase tracking-wider">Projected Gain</p>
                              <p className="text-[#6366F1] font-bold text-lg">₹{w.projectedGain.toLocaleString("en-IN")}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </AnimatedCard>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
