"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { motion } from "framer-motion";
import AnimatedCard, { GlowingOrb } from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { SectionDivider } from "../components/PageVisuals";
import { API_BASE } from "../lib/api";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";

interface Trait {
  trait: string;
  strength: number;
  description: string;
}

interface EmotionalPattern {
  type: string;
  icon: string;
  title: string;
  description: string;
  severity: string;
  transactions?: any[];
}

interface PersonalityData {
  personality: { trait: string; emoji: string };
  traits: Trait[];
  warnings: string[];
  stats: {
    totalTransactions: number;
    savingsRate: number;
    weekendRatio: number;
    lateNightPercent: number;
  };
}

interface EmotionalData {
  emotionalScore: number;
  patterns: EmotionalPattern[];
  advice: string;
}

export default function PersonalityPage() {
  const API = API_BASE;
  const router = useRouter();
  const [personality, setPersonality] = useState<PersonalityData | null>(null);
  const [emotional, setEmotional] = useState<EmotionalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"personality" | "emotional">("personality");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    Promise.all([
      fetch(`${API}/api/personality`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`${API}/api/personality/emotional`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([p, e]) => {
        setPersonality(p);
        setEmotional(e);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router, API]);

  if (loading) {
    return (
      <div className="flex bg-[#141414]">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen flex items-center justify-center">
          <div className="text-gray-400 text-lg">Analyzing your personality...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] relative overflow-hidden">
        <AnimatedBackground />
        <GlowingOrb color="#E50914" size={350} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#6366F1" size={300} bottom="5%" left="-5%" delay={2} />
        <div className="relative z-10 p-8">
        {/* ── Immersive Hero ── */}
        <div className="relative w-full overflow-hidden rounded-3xl mb-8" style={{ minHeight: 300 }}>
          {/* Background */}
          <div className="absolute inset-0 bg-[#080808]" />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 28% 55%, rgba(229,9,20,0.22) 0%, transparent 50%)' }} />
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 78% 50%, rgba(99,102,241,0.16) 0%, transparent 52%)' }} />
          {/* Dot grid */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.05 }}>
            <defs><pattern id="pdots2" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="0.8" fill="#E50914" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#pdots2)" />
          </svg>
          {/* Floating particles */}
          {[{x:'4%',y:'16%',s:3,d:0},{x:'16%',y:'80%',s:2,d:.6},{x:'34%',y:'10%',s:4,d:.9},{x:'46%',y:'78%',s:2,d:.3}].map((p,i)=>(
            <motion.div key={i} className="absolute rounded-full pointer-events-none"
              style={{ width:p.s,height:p.s,background:'#E50914',left:p.x,top:p.y,opacity:.45 }}
              animate={{ y:[-6,6,-6],opacity:[.2,.55,.2] }}
              transition={{ duration:2.4+i*.4,repeat:Infinity,ease:'easeInOut',delay:p.d }} />
          ))}

          {/* 2-column layout */}
          <div className="relative z-10 flex items-stretch" style={{ minHeight: 300 }}>

            {/* ── Left: Text Content ── */}
            <div className="flex flex-col justify-center p-10 pr-6" style={{ width:'52%' }}>
              <motion.span initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1 }}
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.25em] font-bold text-red-400 mb-4">
                AI Analysis
              </motion.span>
              <motion.h1 initial={{ opacity:0,x:-20 }} animate={{ opacity:1,x:0 }} transition={{ delay:.2 }}
                className="text-4xl font-black text-white leading-tight mb-3">
                Money<br /><span className="text-[#E50914]">Personality</span>
              </motion.h1>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
                className="text-sm text-gray-500 leading-relaxed mb-7" style={{ maxWidth: 300 }}>
                Uncover hidden patterns in how you think, feel and behave with money. Your AI-driven profile reveals your financial DNA.
              </motion.p>
              {personality && (
                <motion.div initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:.45 }}
                  className="flex flex-wrap items-center gap-3">
                  {/* Type badge */}
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl" style={{ background:'rgba(229,9,20,0.12)',border:'1px solid rgba(229,9,20,0.35)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white"
                      style={{ background:'rgba(229,9,20,0.35)',boxShadow:'0 0 16px rgba(229,9,20,0.45)' }}>
                      {personality.personality.trait.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest">Your type</div>
                      <div className="text-sm font-bold text-white">{personality.personality.trait}</div>
                    </div>
                  </div>
                  {/* Data points badge */}
                  <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl" style={{ background:'rgba(99,102,241,0.10)',border:'1px solid rgba(99,102,241,0.28)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base text-indigo-300"
                      style={{ background:'rgba(99,102,241,0.22)' }}>
                      {personality.stats.totalTransactions}
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-widest">Data points</div>
                      <div className="text-sm font-bold text-white">Transactions</div>
                    </div>
                  </div>
                  {/* Confidence pill */}
                  <div className="px-3 py-1.5 rounded-full text-xs font-bold text-green-400" style={{ background:'rgba(16,185,129,0.10)',border:'1px solid rgba(16,185,129,0.28)' }}>
                    ✓&nbsp;High confidence
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Right: Personality Network Visualization ── */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ minHeight: 300 }}>
              {/* Behind-SVG glow */}
              <div className="absolute pointer-events-none" style={{ width:220,height:220,left:'50%',top:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,rgba(229,9,20,0.25) 0%,transparent 65%)',borderRadius:'50%',filter:'blur(28px)' }} />
              <div className="absolute pointer-events-none" style={{ width:140,height:140,left:'50%',top:'50%',transform:'translate(-50%,-50%)',background:'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)',borderRadius:'50%',filter:'blur(18px)' }} />

              <svg width="260" height="260" viewBox="0 0 260 260" style={{ overflow:'visible', position:'relative', zIndex:2 }}>
                {/* Static reference circles */}
                <circle cx="130" cy="130" r="110" fill="none" stroke="rgba(229,9,20,0.05)" strokeWidth="1" />
                <circle cx="130" cy="130" r="82" fill="none" stroke="rgba(229,9,20,0.07)" strokeWidth="1" strokeDasharray="4 3" />
                <circle cx="130" cy="130" r="54" fill="none" stroke="rgba(229,9,20,0.10)" strokeWidth="1" />

                {/* Outer ring – 5 nodes, slowly rotating CW */}
                <motion.g animate={{ rotate: 360 }} transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '130px 130px' }}>
                  {([0,72,144,216,288] as number[]).map((angle, i) => {
                    const r2 = (angle * Math.PI) / 180;
                    const nx = 130 + 110 * Math.sin(r2);
                    const ny = 130 - 110 * Math.cos(r2);
                    const cols = ['#E50914','#6366F1','#F59E0B','#10B981','#a78bfa'];
                    return (
                      <g key={i}>
                        <line x1="130" y1="130" x2={nx} y2={ny} stroke={`${cols[i]}`} strokeWidth="0.6" strokeOpacity="0.18" />
                        <circle cx={nx} cy={ny} r="7" fill={`${cols[i]}`} fillOpacity="0.15" stroke={cols[i]} strokeWidth="1.2" />
                        <circle cx={nx} cy={ny} r="3" fill={cols[i]} fillOpacity="0.9" />
                      </g>
                    );
                  })}
                </motion.g>

                {/* Inner ring – 4 nodes, counter-rotating */}
                <motion.g animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                  style={{ transformOrigin: '130px 130px' }}>
                  {([45, 135, 225, 315] as number[]).map((angle, i) => {
                    const r2 = (angle * Math.PI) / 180;
                    const nx = 130 + 54 * Math.sin(r2);
                    const ny = 130 - 54 * Math.cos(r2);
                    const cols = ['#F59E0B','#10B981','#6366F1','#E50914'];
                    return (
                      <g key={i}>
                        <line x1="130" y1="130" x2={nx} y2={ny} stroke={cols[i]} strokeWidth="0.8" strokeOpacity="0.25" />
                        <circle cx={nx} cy={ny} r="5.5" fill={cols[i]} fillOpacity="0.2" stroke={cols[i]} strokeWidth="1" />
                        <circle cx={nx} cy={ny} r="2.5" fill={cols[i]} />
                      </g>
                    );
                  })}
                </motion.g>

                {/* Pulsing outer glow ring */}
                <motion.circle cx="130" cy="130" r="36" fill="none" stroke="rgba(229,9,20,0.4)" strokeWidth="1.5"
                  animate={{ r:[34,40,34], strokeOpacity:[0.6,0.2,0.6] }}
                  transition={{ duration:2.8,repeat:Infinity,ease:'easeInOut' }} />

                {/* Centre orb */}
                <motion.circle cx="130" cy="130" r="30" fill="rgba(229,9,20,0.30)" stroke="rgba(229,9,20,0.65)" strokeWidth="1.8"
                  animate={{ r:[28,32,28] }} transition={{ duration:2.5,repeat:Infinity,ease:'easeInOut' }} />
                <circle cx="130" cy="130" r="20" fill="rgba(229,9,20,0.55)" />

                {/* Personality initial */}
                <text x="130" y="138" textAnchor="middle" fill="white" fontWeight="900" fontSize="26" fontFamily="inherit">
                  {personality?.personality.trait.charAt(0) ?? '?'}
                </text>
              </svg>

              {/* Floating metric pills */}
              {personality && [
                { label:'Savings', val:`${personality.stats.savingsRate}%`, color:'#10B981', dx:-115, dy:-56 },
                { label:'Weekend', val:`${personality.stats.weekendRatio}%`, color:'#F59E0B', dx:82, dy:-52 },
                { label:'Late Night', val:`${personality.stats.lateNightPercent}%`, color:'#E50914', dx:90, dy:58 },
                { label:'Tx count', val:`${personality.stats.totalTransactions}`, color:'#6366F1', dx:-118, dy:52 },
              ].map((m, i) => (
                <motion.div key={i}
                  className="absolute px-3 py-2 rounded-xl text-center pointer-events-none"
                  style={{ left:'50%', top:'50%', transform:`translate(calc(-50% + ${m.dx}px), calc(-50% + ${m.dy}px))`,
                    background:'rgba(8,8,8,0.88)', border:`1px solid ${m.color}35`, backdropFilter:'blur(8px)', minWidth: 74 }}
                  initial={{ opacity:0, scale:0.6 }}
                  animate={{ opacity:1, scale:1, y:[0,-5,0] }}
                  transition={{ delay:.55+i*.15, duration:3+i*.3, repeat:Infinity, ease:'easeInOut', repeatType:'mirror' }}>
                  <div className="text-xs font-black" style={{ color: m.color }}>{m.val}</div>
                  <div className="text-gray-600" style={{ fontSize: 9 }}>{m.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none" style={{ background:'linear-gradient(to top,rgba(10,10,10,0.8),transparent)' }} />
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 mb-8 p-1 rounded-xl w-fit" style={{ background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.06)' }}>
          {(['personality','emotional'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="relative px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{ color: tab===t ? '#fff' : '#666' }}
            >
              {tab===t && (
                <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-lg" style={{ background:'#E50914',boxShadow:'0 0 16px rgba(229,9,20,0.4)' }} transition={{ type:'spring',stiffness:400,damping:30 }} />
              )}
              <span className="relative z-10">{t==='personality' ? 'Personality' : 'Emotional Patterns'}</span>
            </button>
          ))}
        </div>

        {tab === "personality" && personality && (
          <>
            {/* Stats Grid */}
            {(() => {
              const savColor = personality.stats.savingsRate >= 20 ? '#10B981' : personality.stats.savingsRate >= 10 ? '#F59E0B' : '#E50914';
              const wkColor = personality.stats.weekendRatio > 150 ? '#F59E0B' : '#10B981';
              const lnColor = personality.stats.lateNightPercent > 15 ? '#E50914' : '#10B981';
              const stats = [
                {
                  label: 'Savings Rate', value: personality.stats.savingsRate, unit:'%',
                  badge: personality.stats.savingsRate >= 20 ? 'Great discipline!' : personality.stats.savingsRate >= 10 ? 'Room to improve' : 'Needs attention',
                  color: savColor,
                  icon: <path d="M12 2v20M17 7l-5-5-5 5" />,
                  desc: 'Monthly income set aside as savings'
                },
                {
                  label: 'Weekend Ratio', value: personality.stats.weekendRatio, unit:'%',
                  badge: personality.stats.weekendRatio > 150 ? 'Heavy weekends' : 'Well balanced',
                  color: wkColor,
                  icon: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
                  desc: 'Weekend vs weekday spending'
                },
                {
                  label: 'Late Night', value: personality.stats.lateNightPercent, unit:'%',
                  badge: personality.stats.lateNightPercent > 15 ? 'Watch out' : 'Healthy pattern',
                  color: lnColor,
                  icon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
                  desc: 'Spending after midnight'
                },
              ];
              return (
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {stats.map((s, i) => (
                    <motion.div key={i} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:.1+i*.1 }}
                      className="relative overflow-hidden rounded-2xl p-5"
                      style={{ background:'#0f0f0f', border:`1px solid ${s.color}20`, boxShadow:`0 0 30px ${s.color}10` }}
                    >
                      {/* glow wash */}
                      <div className="absolute inset-0 pointer-events-none" style={{ background:`radial-gradient(ellipse at 80% 10%, ${s.color}14 0%, transparent 60%)` }} />
                      <div className="relative flex items-start justify-between mb-4">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:`${s.color}18`,border:`1px solid ${s.color}35`,boxShadow:`0 0 14px ${s.color}22` }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color:s.color,background:`${s.color}15`,border:`1px solid ${s.color}28` }}>{s.badge}</span>
                      </div>
                      <div className="relative">
                        <div className="flex items-end gap-1 mb-1">
                          <span className="text-4xl font-black leading-none" style={{ color:s.color }}>{s.value}</span>
                          <span className="text-lg text-gray-600 mb-0.5 font-bold">{s.unit}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-300 mb-0.5">{s.label}</div>
                        <div className="text-[11px] text-gray-600">{s.desc}</div>
                      </div>
                      {/* bottom bar */}
                      <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                        <motion.div className="h-full rounded-full" style={{ background:s.color }}
                          initial={{ width:0 }} animate={{ width:`${Math.min(s.value,100)}%` }} transition={{ duration:1.4,delay:.5+i*.12,ease:'easeOut' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })()}

            <SectionDivider color="#E50914" />

            {/* Personality Radar — always show */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-8">
              <AnimatedCard className="chart-container rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#E5091418',border:'1px solid #E5091430' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">Trait map</div>
                    <h3 className="text-base font-bold text-white leading-tight">Personality Radar</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={
                    personality.traits.length > 0
                      ? personality.traits.map(t => ({ trait: t.trait, strength: t.strength, fullMark: 100 }))
                      : [
                          { trait: "Savings", strength: Math.min(personality.stats.savingsRate * 2, 100), fullMark: 100 },
                          { trait: "Discipline", strength: personality.stats.lateNightPercent < 10 ? 80 : 40, fullMark: 100 },
                          { trait: "Balance", strength: personality.stats.weekendRatio < 200 ? 75 : 35, fullMark: 100 },
                          { trait: "Consistency", strength: personality.stats.totalTransactions > 20 ? 70 : Math.min(personality.stats.totalTransactions * 10, 70), fullMark: 100 },
                          { trait: "Planning", strength: personality.stats.savingsRate >= 10 ? 65 : 30, fullMark: 100 },
                        ]
                  }>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="trait" tick={{ fill: '#888', fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fill: '#555', fontSize: 9 }} />
                    <Radar name="Strength" dataKey="strength" stroke="#E50914" fill="#E50914" fillOpacity={0.25} animationDuration={2000} />
                  </RadarChart>
                </ResponsiveContainer>
              </AnimatedCard>
            </motion.div>

            {/* Personality Summary — always show */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
              <AnimatedCard className="dark-card p-6 rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#6366F118',border:'1px solid #6366F130' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">Behavioral analysis</div>
                    <h3 className="text-base font-bold text-white leading-tight">Personality Insights</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "Spending Style",
                      value: personality.personality.trait,
                      desc: personality.traits.length > 0
                        ? `Primary trait: ${personality.traits[0].trait}`
                        : "Your spending is well-distributed with no extreme patterns.",
                      color: "#E50914",
                    },
                    {
                      label: "Financial Health",
                      value: personality.stats.savingsRate >= 20 ? "Strong" : personality.stats.savingsRate >= 10 ? "Moderate" : "At Risk",
                      desc: `${personality.stats.savingsRate}% savings rate${personality.stats.savingsRate >= 20 ? " — excellent!" : personality.stats.savingsRate >= 10 ? " — keep pushing." : " — aim for at least 20%."}`,
                      color: personality.stats.savingsRate >= 20 ? "#10B981" : personality.stats.savingsRate >= 10 ? "#F59E0B" : "#EF4444",
                    },
                    {
                      label: "Weekend Behavior",
                      value: personality.stats.weekendRatio > 150 ? "High Spender" : "Balanced",
                      desc: personality.stats.weekendRatio > 150
                        ? `Weekend spending ${personality.stats.weekendRatio - 100}% higher than weekdays.`
                        : "Weekend spending is proportional to weekday habits.",
                      color: personality.stats.weekendRatio > 150 ? "#F59E0B" : "#10B981",
                    },
                    {
                      label: "Time Patterns",
                      value: personality.stats.lateNightPercent > 15 ? "Night Owl" : "Healthy",
                      desc: personality.stats.lateNightPercent > 15
                        ? `${personality.stats.lateNightPercent}% late-night spending detected.`
                        : "Most spending happens during normal hours.",
                      color: personality.stats.lateNightPercent > 15 ? "#EF4444" : "#10B981",
                    },
                  ].map((insight, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
                      className="dark-card p-4 rounded-xl border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: insight.color }} />
                        <span className="text-xs text-gray-500 uppercase tracking-wider">{insight.label}</span>
                      </div>
                      <p className="text-white font-bold text-lg">{insight.value}</p>
                      <p className="text-gray-400 text-sm mt-1">{insight.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
            </motion.div>

            <SectionDivider color="#E50914" />

            {/* Traits — if available */}
            {personality.traits.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <AnimatedCard className="dark-card p-6 mb-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#F59E0B18',border:'1px solid #F59E0B30' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">AI detected</div>
                    <h3 className="text-base font-bold text-white leading-tight">Detected Traits</h3>
                  </div>
                </div>
                <div className="space-y-4">
                  {personality.traits.map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="dark-card p-4 border border-white/[0.06] rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white">
                          {t.trait}
                        </span>
                        <span className="text-sm bg-[#2a2a2a] px-3 py-1 rounded-full text-gray-400">
                          Strength: {t.strength}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                        <div
                          className="netflix-progress h-2 rounded-full"
                          style={{ width: `${Math.min(t.strength, 100)}%` }}
                        />
                      </div>
                      <p className="text-gray-400 text-sm">{t.description}</p>
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
              </motion.div>
            )}

            {/* Warnings */}
            {personality.warnings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
              <AnimatedCard className="dark-card border border-[#E50914]/30 p-6 rounded-2xl">
                <h3 className="font-semibold text-[#E50914] mb-3">
                  Behavior Corrections
                </h3>
                <ul className="space-y-2">
                  {personality.warnings.map((w, i) => (
                    <li
                      key={i}
                      className="text-gray-400 text-sm flex items-start gap-2"
                    >
                      <span className="text-[#E50914] mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      </span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </AnimatedCard>
              </motion.div>
            )}

            {/* Tips — always show */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <AnimatedCard className="dark-card p-6 rounded-2xl mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:'#10B98118',border:'1px solid #10B98130' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">Personalised</div>
                    <h3 className="text-base font-bold text-white leading-tight">Recommendations</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {(personality.traits.length > 0
                    ? personality.traits.map(t => t.description)
                    : [
                        "Your spending patterns are well-balanced. Keep maintaining this discipline!",
                        `Savings rate is ${personality.stats.savingsRate}%. ${personality.stats.savingsRate >= 20 ? "You're on a great path — consider investing the surplus." : "Try to push toward 20% to build a stronger financial cushion."}`,
                        personality.stats.weekendRatio > 150 ? "Weekend spending runs high — set a weekend-only budget to stay on track." : "Weekend-to-weekday spending ratio looks healthy.",
                        personality.stats.lateNightPercent > 0 ? "Late-night purchases can be impulsive. Try a 24-hour rule before buying." : "No late-night spending detected — great self-control!",
                        "Add more transactions to unlock deeper personality insights and trait detection.",
                      ]
                  ).map((tip, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#E50914]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[#E50914] text-xs font-bold">{i + 1}</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </AnimatedCard>
            </motion.div>
          </>
        )}

        {tab === "emotional" && emotional && (
          <>
            {/* Emotional Score */}
            <div
              className={`rounded-xl p-8 mb-8 text-white ${
                emotional.emotionalScore >= 50
                  ? "stat-card-red"
                  : emotional.emotionalScore >= 25
                  ? "bg-[#f59e0b]/20 border border-[#f59e0b]/30"
                  : "bg-emerald-500/20 border border-emerald-500/30"
              }`}
            >
              <div className="flex items-center gap-6">
                <span className="text-6xl font-bold">
                  {emotional.emotionalScore}
                </span>
                <div>
                  <h2 className="text-2xl font-bold mb-1 text-white">
                    Emotional Spending Score
                  </h2>
                  <p className="text-gray-300">{emotional.advice}</p>
                </div>
              </div>
            </div>

            {/* Patterns */}
            {emotional.patterns.length > 0 ? (
              <div className="grid gap-4">
                {emotional.patterns.map((p, i) => (
                  <div
                    key={i}
                    className={`dark-card p-6 border-l-4 ${
                      p.severity === "high"
                        ? "border-[#E50914]"
                        : p.severity === "medium"
                        ? "border-yellow-500"
                        : "border-gray-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{p.icon}</span>
                      <h3 className="font-semibold text-lg text-white">{p.title}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          p.severity === "high"
                            ? "bg-[#E50914]/20 text-red-300"
                            : p.severity === "medium"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : "bg-gray-600/20 text-gray-300"
                        }`}
                      >
                        {p.severity}
                      </span>
                    </div>
                    <p className="text-gray-400">{p.description}</p>
                    {p.transactions && p.transactions.length > 0 && (
                      <div className="mt-3 bg-[#1a1a1a] rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">
                          Recent examples:
                        </p>
                        {p.transactions.map((t: any, j: number) => (
                          <div
                            key={j}
                            className="flex justify-between text-sm py-1 text-gray-400"
                          >
                            <span>{t.title}</span>
                            <span className="text-[#E50914]">₹{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dark-card p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                <p className="text-gray-400">
                  No emotional spending patterns detected. You're spending
                  rationally!
                </p>
              </div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
