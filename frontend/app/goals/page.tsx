"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCard, { GlowingOrb, StaggerContainer, StaggerItem, FloatingElement } from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { GoalsHero, SectionDivider } from "../components/PageVisuals";
import { awardXP } from "../lib/xp";

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  remaining: number;
  progress: number;
  category: string;
  priority: string;
  status: string;
  deadline: string | null;
  daysLeft: number | null;
  onTrack: boolean | null;
  monthsToGoal: number | null;
  avgMonthlySavings: number;
}

interface GoalData {
  goals: Goal[];
  summary: {
    activeCount: number;
    completedCount: number;
    totalTarget: number;
    totalSaved: number;
    overallProgress: number;
    avgMonthlySavings: number;
  };
}

export default function GoalsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [data, setData] = useState<GoalData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [goalCategory, setGoalCategory] = useState("");
  const [priority, setPriority] = useState("medium");

  // Contribute modal
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const fetchGoals = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/goals/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await res.json();
    setData(d);
    setLoading(false);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchGoals();
  }, [router, API]);

  const createGoal = async () => {
    const token = localStorage.getItem("token");
    if (!title || !targetAmount) {
      alert("Title and target amount required");
      return;
    }
    const res = await fetch(`${API}/api/goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title,
        targetAmount: Number(targetAmount),
        deadline: deadline || undefined,
        category: goalCategory || undefined,
        priority,
      }),
    });
    if (res.ok) {
      setTitle("");
      setTargetAmount("");
      setDeadline("");
      setGoalCategory("");
      setPriority("medium");
      fetchGoals();
    } else {
      const d = await res.json();
      alert(d.message);
    }
  };

  const contribute = async () => {
    if (!contributeId || !contributeAmount) return;
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API}/api/goals/${contributeId}/contribute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Number(contributeAmount) }),
      }
    );
    if (res.ok) {
      const result = await res.json().catch(() => ({}));
      // Award XP for contributing to a goal
      awardXP("goal_contributed", 15);
      // Award bonus XP if the goal just hit 100% / completed
      const prog = result?.progress ?? result?.goal?.progress ?? 0;
      if (
        prog >= 100 ||
        result?.status === "completed" ||
        result?.goal?.status === "completed"
      ) {
        awardXP(`goal_completed_${contributeId}`, 50);
      }
      setContributeId(null);
      setContributeAmount("");
      fetchGoals();
    } else {
      alert("Failed to add contribution");
    }
  };

  const deleteGoal = async (id: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/api/goals/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) fetchGoals();
    else alert("Failed to delete goal");
  };

  const formatCurrency = (n: number) => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
    return `₹${n}`;
  };

  if (loading) {
    return (
      <div className="flex bg-[#141414]">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen flex items-center justify-center">
          <div className="text-gray-400 text-lg">Loading goals...</div>
        </main>
      </div>
    );
  }

  return (
<div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] relative overflow-hidden">
        <AnimatedBackground />
        <GlowingOrb color="#6366F1" size={350} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#E50914" size={250} bottom="10%" left="-5%" delay={2} />
        <div className="relative z-10 p-8 pb-28">
        <GoalsHero />

        {/* Summary */}
        {data && (
          <StaggerContainer className="grid grid-cols-4 gap-4 mb-8">
            {[{label:"Total Target",value:formatCurrency(data.summary.totalTarget),color:"#6366F1"},{label:"Active Goals",value:data.summary.activeCount,color:"#E50914"},{label:"Completed",value:data.summary.completedCount,color:"#10B981"},{label:"Monthly Savings",value:formatCurrency(data.summary.avgMonthlySavings),color:"#F59E0B"}].map((s,i)=>(
              <StaggerItem key={i}>
                <AnimatedCard className="dark-card p-5 text-center rounded-2xl" delay={i*0.1}>
                  <p className="text-sm text-gray-400">{s.label}</p>
                  <p className="text-3xl font-bold mt-2" style={{color:s.color}}>{s.value}</p>
                  <div className="mt-3 h-1 rounded-full overflow-hidden bg-white/5"><motion.div className="h-full rounded-full" style={{background:s.color}} initial={{width:0}} animate={{width:"100%"}} transition={{duration:1.5,delay:0.3+i*0.15}} /></div>
                </AnimatedCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        <SectionDivider color="#6366F1" />

        {/* Add Goal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <AnimatedCard className="dark-card p-6 mb-8 rounded-2xl">
          <h2 className="font-semibold text-lg mb-4 text-white">Add New Goal</h2>
          <div className="grid grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Goal (e.g. Laptop)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="dark-input rounded-lg p-2 text-white"
            />
            <input
              type="number"
              placeholder="Target Amount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="dark-input rounded-lg p-2 text-white"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="dark-input rounded-lg p-2 text-white"
            />
            <input
              type="text"
              placeholder="Category"
              value={goalCategory}
              onChange={(e) => setGoalCategory(e.target.value)}
              className="dark-input rounded-lg p-2 text-white"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="dark-input rounded-lg p-2 text-white"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
          <button
            onClick={createGoal}
            className="mt-3 netflix-btn rounded-xl"
          >
            Create Goal
          </button>
        </AnimatedCard>
        </motion.div>

        <SectionDivider color="#6366F1" />

        {/* Goals List */}
        {data && data.goals.length > 0 ? (
          <div className="grid gap-4">
            {data.goals.map((g) => {
              const borderColor =
                g.status === "completed"
                  ? "border-emerald-400"
                  : g.onTrack === false
                  ? "border-red-400"
                  : g.onTrack === true
                  ? "border-green-400"
                  : "border-blue-400";

              return (
                <div
                  key={g.id}
                  className={`dark-card p-6 border-l-4 ${borderColor}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-white">{g.title}</h3>
                        {g.status === "completed" && (
                          <span className="text-xs bg-emerald-500/50 text-white px-2 py-0.5 rounded-full">
                            COMPLETED ✓
                          </span>
                        )}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            g.priority === "high"
                              ? "bg-red-500/30 text-white"
                              : g.priority === "medium"
                              ? "bg-yellow-500/30 text-white"
                              : "bg-gray-500/30 text-white"
                          }`}
                        >
                          {g.priority}
                        </span>
                      </div>
                      {g.category && (
                        <p className="text-sm text-gray-400">{g.category}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {g.status === "active" && (
                        <button
                          onClick={() => setContributeId(g.id)}
                          className="netflix-btn text-sm px-4 py-2"
                        >
                          + Add Money
                        </button>
                      )}
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="bg-[#E50914] hover:bg-[#B20710] text-white px-3 py-1 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex justify-between text-sm mb-1 text-white">
                    <span>
                      {formatCurrency(g.savedAmount)} /{" "}
                      {formatCurrency(g.targetAmount)}
                    </span>
                    <span className="font-bold">{g.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-3 mb-3">
                    <div
                      className="netflix-progress h-3 rounded-full"
                      style={{
                        width: `${Math.min(g.progress, 100)}%`,
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex gap-6 text-xs text-gray-400">
                    {g.remaining > 0 && (
                      <span>₹{g.remaining.toLocaleString()} remaining</span>
                    )}
                    {g.monthsToGoal !== null && g.status === "active" && (
                      <span>
                        ~{g.monthsToGoal} months to go at current savings
                      </span>
                    )}
                    {g.deadline && (
                      <span>
                        Deadline: {new Date(g.deadline).toLocaleDateString()}
                        {g.daysLeft !== null &&
                          ` (${g.daysLeft > 0 ? g.daysLeft + " days left" : "overdue"})`}
                      </span>
                    )}
                    {g.onTrack === false && g.status === "active" && (
                      <span className="text-red-400 font-medium flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        Not on track
                      </span>
                    )}
                    {g.onTrack === true && g.status === "active" && (
                      <span className="text-green-400 font-medium flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        On track
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dark-card p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E50914]/10 flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
            <p className="text-gray-400">
              No goals yet. Create one above to start tracking!
            </p>
          </div>
        )}

        {/* Contribute Modal */}
        </div>
        <AnimatePresence>
        {contributeId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="dark-card w-full max-w-sm p-6 mx-4 rounded-2xl border border-white/[0.08]">
              <h2 className="text-xl font-bold mb-4 text-white">Add Money to Goal</h2>
              <input
                type="number"
                placeholder="Amount"
                value={contributeAmount}
                onChange={(e) => setContributeAmount(e.target.value)}
                className="w-full dark-input rounded-lg p-2 mb-4 text-white"
              />
              <div className="flex gap-3">
                <button
                  onClick={contribute}
                  className="flex-1 netflix-btn"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setContributeId(null);
                    setContributeAmount("");
                  }}
                  className="flex-1 bg-white/[0.05] hover:bg-white/[0.1] text-white py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
}
