"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import AnimatedCard, { GlowingOrb, StaggerContainer, StaggerItem, FloatingElement } from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { SubscriptionHero, SectionDivider } from "../components/PageVisuals";
import BillingCalendar from "../components/BillingCalendar";

interface Subscription {
  title: string;
  amount: number;
  category: string;
  monthsDetected: number;
  yearlyCost: number;
  totalSpent: number;
  confidence: string;
  firstSeen?: string;
  lastSeen?: string;
}

interface SubData {
  subscriptions: Subscription[];
  summary: {
    totalSubscriptions: number;
    monthlyTotal: number;
    yearlyTotal: number;
    leakScore: number;
    leakPercent: number;
  };
  advice: string;
}

export default function SubscriptionsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [data, setData] = useState<SubData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/api/subscriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router, API]);

  if (loading) {
    return (
      <div className="flex bg-[#141414]">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen flex items-center justify-center">
          <div className="text-gray-400 text-lg">Scanning subscriptions...</div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const CIRC = 2 * Math.PI * 52;
  const leakPct = Math.min(data.summary.leakScore, 100);

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] relative overflow-hidden">
        <AnimatedBackground />
        <GlowingOrb color="#E50914" size={350} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#F59E0B" size={250} bottom="10%" left="-5%" delay={2} />
        <div className="relative z-10 p-8">
        <SubscriptionHero />

        {/* Leak Score */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, type: "spring" }}>
        <AnimatedCard className="dark-card p-8 mb-8 rounded-2xl">
          <div className="flex items-center gap-8">
            <div className="relative">
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                <motion.circle cx="65" cy="65" r="52" fill="none" stroke="#E50914" strokeWidth="10" strokeLinecap="round" strokeDasharray={CIRC} initial={{ strokeDashoffset: CIRC }} animate={{ strokeDashoffset: CIRC - (CIRC * leakPct) / 100 }} transition={{ duration: 2, ease: "easeOut" }} style={{ filter: "drop-shadow(0 0 8px rgba(229,9,20,0.5))", transform: "rotate(-90deg)", transformOrigin: "center" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span className="text-3xl font-bold text-[#E50914]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>{data.summary.leakScore}</motion.span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Silent Money Leak Score
              </h2>
              <p className="text-gray-400 mb-3">{data.advice}</p>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-400">Monthly: </span>
                  <span className="font-bold text-white bg-[#E50914]/30 px-2 py-1 rounded">
                    ₹{data.summary.monthlyTotal}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Yearly: </span>
                  <span className="font-bold text-white bg-[#E50914]/30 px-2 py-1 rounded">
                    ₹{data.summary.yearlyTotal}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">
                    {data.summary.leakPercent}% of monthly expenses
                  </span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
        </motion.div>

        <SectionDivider color="#F59E0B" />

        {/* Subscriptions List */}
        {data.subscriptions.length > 0 ? (
          <StaggerContainer className="dark-card p-6 rounded-2xl">
            <h2 className="font-semibold text-lg mb-4 text-white">
              Detected Recurring Payments ({data.summary.totalSubscriptions})
            </h2>
            <div className="space-y-3">
              {data.subscriptions.map((sub, i) => {
                const borderColor = sub.confidence === "high" ? "border-[#E50914]" : sub.confidence === "medium" ? "border-yellow-500" : "border-gray-600";
                return (
                  <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.04)" }}
                    className={`dark-card flex items-center justify-between p-4 border-l-4 ${borderColor} rounded-xl transition`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          sub.confidence === "high"
                            ? "bg-[#E50914]"
                            : "bg-yellow-500"
                        }`}
                      >
                        {sub.confidence === "high" ? "!" : "?"}
                      </div>
                      <div>
                        <p className="font-semibold capitalize text-white">{sub.title}</p>
                        <p className="text-sm text-gray-400">
                          {sub.category || "Uncategorized"} · Seen{" "}
                          {sub.monthsDetected} months · Confidence:{" "}
                          {sub.confidence}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white bg-[#E50914]/30 px-3 py-1 rounded-lg">
                        ₹{sub.amount}/month
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        ₹{sub.yearlyCost}/year
                      </p>
                    </div>
                  </motion.div>
                  </StaggerItem>
                );
              })}
            </div>
          </StaggerContainer>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="dark-card p-8 text-center rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
            <p className="text-gray-400 text-lg">
              No recurring subscriptions detected! You&apos;re clean.
            </p>
          </motion.div>
        )}

        {/* Billing Calendar */}
        {data.subscriptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
            <BillingCalendar subscriptions={data.subscriptions} />
          </motion.div>
        )}
        </div>
      </main>
    </div>
  );
}
