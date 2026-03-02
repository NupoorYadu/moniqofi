"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AnimatedCard, {
  GlowingOrb,
  StaggerContainer,
  StaggerItem,
} from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { motion } from "framer-motion";
import { awardXP } from "../lib/xp";
import { SectionDivider } from "../components/PageVisuals";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface BreakdownItem {
  label: string;
  score: number;
  max: number;
  detail: string;
  tip: string;
}

interface HealthData {
  score: number;
  maxScore: number;
  grade: string;
  emoji: string;
  breakdown: BreakdownItem[];
  message: string;
}

export default function HealthScore() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [data, setData] = useState<HealthData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetch(`${API}/api/health-score`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        const score = d?.score ?? 0;
        const lastScore = parseInt(localStorage.getItem("moniqofi_last_health_score") || "0");
        // Award XP for improving your health score since last visit
        if (score > lastScore && lastScore > 0) awardXP("health_improved", 25);
        // Award XP for maintaining a healthy score (≥60)
        if (score >= 60) awardXP("health_score_viewed", 10);
        localStorage.setItem("moniqofi_last_health_score", String(score));
      })
      .catch(() => {});
  }, [router]);

  if (!data) {
    return (
      <div className="flex">
        <Sidebar />
        <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full"
          />
        </main>
      </div>
    );
  }

  const scoreColor =
    data.score >= 80 ? "#10B981" : data.score >= 60 ? "#F59E0B" : "#E50914";

  const radarData = data.breakdown.map((b) => ({
    category: b.label,
    score: b.score,
    fullMark: b.max,
  }));

  const barData = data.breakdown.map((b) => ({
    name: b.label.replace(/\s+/g, "\n"),
    score: b.score,
    max: b.max,
    pct: Math.round((b.score / b.max) * 100),
  }));

  const barColors = ["#E50914", "#ff4555", "#6366F1", "#F59E0B", "#10B981"];

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen bg-[#0A0A0A] relative overflow-hidden">
        <AnimatedBackground />
        <GlowingOrb color="#E50914" size={350} top="-8%" right="-8%" delay={0} />
        <GlowingOrb color="#6366F1" size={300} bottom="5%" left="-8%" delay={2} />

        <div className="relative z-10 p-8">
          {/* ─── Hero Banner — 3-column full-width ─── */}
          <div className="relative w-full overflow-hidden rounded-3xl mb-8" style={{ minHeight: 280 }}>
            {/* BG layers */}
            <div className="absolute inset-0" style={{ background: '#080808' }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 50%, ${scoreColor}18 0%, transparent 65%)` }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 5% 50%, rgba(99,102,241,0.08) 0%, transparent 45%)' }} />
            {/* Subtle dot grid */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }}>
              <defs>
                <pattern id="dotgrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="1" fill="#E50914" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dotgrid)" />
            </svg>


            {/* ── 3-column layout ── */}
            <div className="relative z-10 flex items-stretch" style={{ minHeight: 280 }}>

              {/* COL 1 — Title + info (38%) */}
              <div className="flex flex-col justify-center px-10 py-8" style={{ width: '38%' }}>
                <motion.span
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[.25em] font-bold text-red-400 mb-5"
                >
                  Wellness Check
                </motion.span>
                <motion.h1
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
                  className="text-5xl font-black leading-none mb-3"
                >
                  <span className="text-white">Financial</span><br />
                  <span style={{ color: scoreColor }}>Health</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
                  className="text-sm text-gray-500 leading-relaxed mb-7"
                >
                  Real-time analysis of your income, spending, savings and debt across all categories.
                </motion.p>
                {/* Stat pills row */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="flex items-center gap-3 flex-wrap">
                  {[
                    { label: 'Grade', value: `Grade ${data.grade}`, color: scoreColor },
                    { label: 'Status', value: data.score >= 80 ? 'Excellent' : data.score >= 60 ? 'Good' : data.score >= 40 ? 'Fair' : 'Needs Work', color: scoreColor },
                  ].map((pill, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[9px] uppercase tracking-[.18em] text-gray-600 mb-0.5">{pill.label}</span>
                      <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: pill.color, background: `${pill.color}15`, border: `1px solid ${pill.color}30` }}>{pill.value}</span>
                    </div>
                  ))}
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5">
                  <span className="text-xs text-gray-600 hover:text-red-400 cursor-pointer transition-colors inline-flex items-center gap-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
                    How is this calculated?
                  </span>
                </motion.div>
              </div>

              {/* COL 2 — Score ring hero (24%) */}
              <div className="flex flex-col items-center justify-center" style={{ width: '24%' }}>
                <div className="relative">
                  {/* Outer glow pulse */}
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${scoreColor}22 0%, transparent 70%)`, margin: '-20px' }}
                    animate={{ opacity: [0.4, 0.9, 0.4] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <svg width="180" height="180" className="-rotate-90">
                    {/* Tick marks */}
                    {Array.from({ length: 24 }).map((_, i) => {
                      const ang = (i / 24) * 2 * Math.PI;
                      const long = i % 6 === 0;
                      const inner = long ? 80 : 83;
                      return <line key={i}
                        x1={90 + inner * Math.cos(ang)} y1={90 + inner * Math.sin(ang)}
                        x2={90 + 88 * Math.cos(ang)} y2={90 + 88 * Math.sin(ang)}
                        stroke={long ? scoreColor : 'rgba(255,255,255,0.08)'} strokeWidth={long ? 1.5 : 0.8} opacity={long ? 0.5 : 1}
                      />;
                    })}
                    {/* Track */}
                    <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
                    {/* Glow backing arc */}
                    <circle cx="90" cy="90" r="72" fill="none" stroke={scoreColor} strokeWidth="9" opacity="0.06" />
                    {/* Progress arc */}
                    <motion.circle cx="90" cy="90" r="72" fill="none" stroke={scoreColor} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 72}
                      initial={{ strokeDashoffset: 2 * Math.PI * 72 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 72 * (1 - data.score / 100) }}
                      transition={{ duration: 2.2, ease: 'easeOut', delay: 0.4 }}
                      style={{ filter: `drop-shadow(0 0 12px ${scoreColor}aa)` }}
                    />
                    {/* Inner accent ring */}
                    <motion.circle cx="90" cy="90" r="60" fill="none" stroke={scoreColor} strokeWidth="1.5"
                      strokeDasharray={2 * Math.PI * 60}
                      initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - data.score / 100) }}
                      transition={{ duration: 2.2, ease: 'easeOut', delay: 0.65 }}
                      opacity={0.25}
                    />
                  </svg>
                  {/* Center text (not rotated) */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span className="text-5xl font-black leading-none" style={{ color: scoreColor }}
                      initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 280 }}>
                      {data.score}
                    </motion.span>
                    <span className="text-gray-600 text-xs mt-0.5">/100</span>
                  </div>
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
                  className="mt-3 text-[11px] uppercase tracking-[.18em] text-gray-500">Financial Score</motion.div>
              </div>

              {/* COL 3 — ECG Heartbeat Visualization (38%) */}
              <div className="flex flex-col items-center justify-center relative overflow-hidden" style={{ width: '38%' }}>
                {/* Label top */}
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
                  className="absolute top-6 left-8 text-[10px] uppercase tracking-[.2em] font-bold text-gray-600">
                  Vitals Monitor
                </motion.div>

                {/* Glow behind ECG */}
                <div className="absolute pointer-events-none" style={{ width:260,height:80,top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:`radial-gradient(ellipse at 50% 50%, ${scoreColor}25 0%, transparent 70%)`,filter:'blur(18px)' }} />

                {/* ECG SVG */}
                <svg width="100%" height="110" viewBox="0 0 340 110" style={{ overflow:'visible' }}>
                  {/* Grid lines */}
                  {[0,1,2,3,4].map(i=>(
                    <line key={i} x1="0" y1={22*i+8} x2="340" y2={22*i+8} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                  ))}
                  {[0,1,2,3,4,5,6,7,8].map(i=>(
                    <line key={i} x1={42*i+2} y1="0" x2={42*i+2} y2="110" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                  ))}

                  {/* Flat baseline → ECG spike → flat */}
                  {/* Full path: flat … small bump … big QRS spike … flat … repeat */}
                  <motion.path
                    d="M0,55 L30,55 L38,55 L42,48 L46,55 L55,55 L60,28 L65,82 L70,18 L75,55 L84,55 L88,50 L92,55 L120,55 L148,55 L152,48 L156,55 L165,55 L170,28 L175,82 L180,18 L185,55 L194,55 L198,50 L202,55 L230,55 L258,55 L262,48 L266,55 L275,55 L280,28 L285,82 L290,18 L295,55 L304,55 L308,50 L312,55 L340,55"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 6px ${scoreColor}cc)` }}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2.2, ease: 'easeInOut', delay: 0.4 }}
                  />

                  {/* Animated travelling dot along the ECG */}
                  <motion.circle r="4" fill={scoreColor}
                    style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }}
                    initial={{ offsetDistance: '0%', opacity: 0 }}
                    animate={{ offsetDistance: '100%', opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 2.4, repeatDelay: 0.5 }}>
                    <animateMotion
                      dur="3.2s"
                      repeatCount="indefinite"
                      begin="2.4s"
                      path="M0,55 L30,55 L38,55 L42,48 L46,55 L55,55 L60,28 L65,82 L70,18 L75,55 L84,55 L88,50 L92,55 L120,55 L148,55 L152,48 L156,55 L165,55 L170,28 L175,82 L180,18 L185,55 L194,55 L198,50 L202,55 L230,55 L258,55 L262,48 L266,55 L275,55 L280,28 L285,82 L290,18 L295,55 L304,55 L308,50 L312,55 L340,55"
                    />
                  </motion.circle>

                  {/* Second dimmer ECG line — trailing ghost */}
                  <motion.path
                    d="M0,55 L30,55 L38,55 L42,48 L46,55 L55,55 L60,28 L65,82 L70,18 L75,55 L84,55 L88,50 L92,55 L120,55 L148,55 L152,48 L156,55 L165,55 L170,28 L175,82 L180,18 L185,55 L194,55 L198,50 L202,55 L230,55 L258,55 L262,48 L266,55 L275,55 L280,28 L285,82 L290,18 L295,55 L304,55 L308,50 L312,55 L340,55"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.08"
                  />
                </svg>

                {/* Metric pills row */}
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:.85 }}
                  className="flex items-center gap-3 mt-3 px-8">
                  {[
                    { label:'BPM',    val:'72',   color:'#E50914' },
                    { label:'Score',  val:`${data.score}`, color: scoreColor },
                    { label:'Grade',  val: data.grade,  color:'#6366F1' },
                  ].map((m,i)=>(
                    <div key={i} className="flex-1 text-center px-2 py-2 rounded-xl"
                      style={{ background:`${m.color}10`, border:`1px solid ${m.color}25` }}>
                      <div className="text-sm font-black" style={{ color: m.color }}>{m.val}</div>
                      <div className="text-[9px] text-gray-600 uppercase tracking-wider mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* Pulsing status dot bottom */}
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1 }}
                  className="absolute bottom-6 right-8 flex items-center gap-2">
                  <motion.div className="w-2 h-2 rounded-full" style={{ background: scoreColor }}
                    animate={{ opacity:[1,0.2,1], scale:[1,1.6,1] }}
                    transition={{ duration:1.6, repeat:Infinity, ease:'easeInOut' }} />
                  <span className="text-[10px] text-gray-600 uppercase tracking-widest">Live</span>
                </motion.div>
              </div>
            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(8,8,8,0.6), transparent)' }} />
          </div>

          {/* Score Factors + Radar */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* ── Score Factor Panel ── */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-1 rounded-2xl overflow-hidden"
              style={{ background:'#0f0f0f', border:'1px solid rgba(255,255,255,0.06)' }}
            >
              {/* Panel header */}
              <div className="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-white/[0.05]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background:`${scoreColor}18`, border:`1px solid ${scoreColor}30` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] text-gray-600 uppercase tracking-widest">Per category</div>
                  <div className="text-sm font-bold text-white leading-tight">Score Factors</div>
                </div>
              </div>

              {/* Factor rows */}
              <div className="p-3 flex flex-col gap-2">
                {data.breakdown.map((b, i) => {
                  const pct = Math.round((b.score / b.max) * 100);
                  const factorColors = ["#E50914", "#6366F1", "#F59E0B", "#10B981", "#ff4555"];
                  const c = factorColors[i % factorColors.length];
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.09 }}
                      className="relative overflow-hidden rounded-xl px-4 py-3"
                      style={{ background: `${c}08`, border: `1px solid ${c}20` }}
                    >
                      {/* Top row */}
                      <div className="flex items-center gap-3 mb-2">
                        {/* Mini arc */}
                        <svg width="36" height="36" className="shrink-0 -rotate-90">
                          <circle cx="18" cy="18" r="13" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <motion.circle cx="18" cy="18" r="13" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 13}
                            initial={{ strokeDashoffset: 2 * Math.PI * 13 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 13 * (1 - pct / 100) }}
                            transition={{ duration: 1.3, delay: 0.45 + i * 0.1, ease: 'easeOut' }}
                            style={{ filter: `drop-shadow(0 0 5px ${c}90)` }}
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] text-gray-500 truncate">{b.label}</div>
                          <div className="flex items-end gap-1 mt-0.5">
                            <span className="text-base font-black leading-none" style={{ color: c }}>{pct}</span>
                            <span className="text-[10px] text-gray-600">%</span>
                          </div>
                        </div>
                        {/* Score badge */}
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold" style={{ color: c }}>{b.score}</div>
                          <div className="text-[9px] text-gray-600">/{b.max}</div>
                        </div>
                      </div>
                      {/* Fill bar */}
                      <div className="h-1 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.05)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(to right, ${c}88, ${c})` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.3, delay: 0.5 + i * 0.1, ease: 'easeOut' }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-2"
            >
              <AnimatedCard className="chart-container rounded-2xl h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E50914' + '18', border: '1px solid #E5091430' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">Multi-axis</div>
                    <h2 className="text-base font-bold text-white leading-tight">Health Radar</h2>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="category"
                      tick={{ fill: "#888", fontSize: 11 }}
                    />
                    <PolarRadiusAxis tick={{ fill: "#555", fontSize: 9 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#E50914"
                      fill="#E50914"
                      fillOpacity={0.25}
                      animationDuration={2000}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </AnimatedCard>
            </motion.div>
          </div>

          <SectionDivider color={scoreColor} />

          {/* Assessment Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <AnimatedCard className="dark-card p-6 rounded-2xl border border-white/[0.06]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${scoreColor}15`, border: `1px solid ${scoreColor}30` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-base font-bold text-white">Assessment</h2>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold" style={{ color: scoreColor, background: `${scoreColor}15` }}>AI Insight</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed text-sm">{data.message}</p>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          <SectionDivider color={scoreColor} />

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <AnimatedCard className="chart-container rounded-2xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#6366F1' + '18', border: '1px solid #6366F130' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 17V13M12 17V9M16 17v-5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-600 uppercase tracking-widest">Per category</div>
                    <h2 className="text-base font-bold text-white leading-tight">Score Breakdown</h2>
                  </div>
                </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#555"
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis stroke="#555" tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#1A1A1A] border border-white/10 rounded-xl p-3 shadow-xl">
                            <p className="text-white font-semibold text-sm">
                              {d.name.replace(/\n/g, " ")}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              Score: {d.score}/{d.max} ({d.pct}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="score"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                  >
                    {barData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={barColors[i % barColors.length]}
                        style={{
                          filter: `drop-shadow(0 0 4px ${barColors[i % barColors.length]}50)`,
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </AnimatedCard>
          </motion.div>

          <SectionDivider color={scoreColor} />

          {/* Detailed Breakdown Cards */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: scoreColor + '18', border: `1px solid ${scoreColor}30` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={scoreColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">Detailed view</div>
              <h2 className="text-base font-bold text-white leading-tight">Category Breakdown</h2>
            </div>
          </div>
          <StaggerContainer className="grid grid-cols-2 gap-4 mb-8">
            {data.breakdown.map((b, i) => {
              const pct = Math.round((b.score / b.max) * 100);
              const color = barColors[i % barColors.length];
              return (
                <StaggerItem key={i}>
                  <AnimatedCard
                    className="dark-card p-5 rounded-2xl"
                    delay={i * 0.1}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold text-sm">
                        {b.label}
                      </h3>
                      <span
                        className="text-sm font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color,
                          background: `${color}20`,
                        }}
                      >
                        {b.score}/{b.max}
                      </span>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full bg-white/[0.05] rounded-full h-2.5 overflow-hidden mb-3">
                      <motion.div
                        className="h-2.5 rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 1.5,
                          delay: 0.5 + i * 0.15,
                          ease: "easeOut",
                        }}
                      />
                    </div>

                    <p className="text-gray-500 text-xs mb-2">{b.detail}</p>

                    {/* Tip */}
                    <div
                      className="p-3 rounded-lg mt-2"
                      style={{
                        background: `${color}08`,
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <p className="text-xs text-gray-400">
                        Tip: {b.tip}
                      </p>
                    </div>
                  </AnimatedCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          {/* ── Guide: Understanding Your Health Score ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-8 space-y-6"
          >
            {/* How Scoring Works */}
            <AnimatedCard className="dark-card p-6 rounded-2xl border border-white/[0.04]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E5091418', border: '1px solid #E5091430' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">How Your Score Is Calculated</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: "1", title: "Track Spending", desc: "Your transactions — manual or bank-synced — are analyzed against your income and budget targets.", color: "#E50914" },
                  { step: "2", title: "Evaluate Habits", desc: "We check savings rate, debt levels, emergency fund, and how well you stick to your budgets.", color: "#6366F1" },
                  { step: "3", title: "Generate Score", desc: "Each category is weighted, combined, and graded on a 0-100 scale updated in real time.", color: "#10B981" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: `${item.color}20`, color: item.color }}
                    >
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* Score Ranges */}
            <AnimatedCard className="dark-card p-6 rounded-2xl border border-white/[0.04]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#3B82F618', border: '1px solid #3B82F630' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">Score Ranges</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { range: "90 - 100", grade: "A+", label: "Excellent", color: "#10B981", desc: "Outstanding financial discipline" },
                  { range: "70 - 89", grade: "B", label: "Good", color: "#3B82F6", desc: "Solid habits, room to optimize" },
                  { range: "50 - 69", grade: "C", label: "Fair", color: "#F59E0B", desc: "Some areas need attention" },
                  { range: "0 - 49", grade: "D", label: "Needs Work", color: "#E50914", desc: "Focus on building better habits" },
                ].map((r) => (
                  <div
                    key={r.grade}
                    className="p-4 rounded-xl text-center"
                    style={{ background: `${r.color}08`, border: `1px solid ${r.color}20` }}
                  >
                    <div
                      className="text-2xl font-black mb-1"
                      style={{ color: r.color }}
                    >
                      {r.grade}
                    </div>
                    <div className="text-xs text-gray-400 font-semibold">{r.range}</div>
                    <div className="text-xs text-gray-500 mt-1">{r.label}</div>
                    <p className="text-[10px] text-gray-600 mt-1">{r.desc}</p>
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* What Each Category Measures */}
            <AnimatedCard className="dark-card p-6 rounded-2xl border border-white/[0.04]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#6366F118', border: '1px solid #6366F130' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6h16M4 12h16M4 18h7"/>
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">What Each Category Measures</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Savings Rate", icon: "S", color: "#10B981", desc: "Percentage of income saved each month. Higher savings = better preparedness for the future." },
                  { label: "Debt Management", icon: "D", color: "#E50914", desc: "Debt-to-income ratio, on-time payments, and progress on paying down balances." },
                  { label: "Budget Adherence", icon: "B", color: "#6366F1", desc: "How consistently you stay within your set budget categories month over month." },
                  { label: "Emergency Fund", icon: "E", color: "#F59E0B", desc: "Whether you have 3-6 months of expenses set aside for unexpected situations." },
                  { label: "Spending Patterns", icon: "P", color: "#ff4555", desc: "Analyzes discretionary vs. essential spending and flags unusual spikes." },
                ].map((cat) => (
                  <div key={cat.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: `${cat.color}15`, color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{cat.label}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>

            {/* Tips to Improve */}
            <AnimatedCard className="dark-card p-6 rounded-2xl border border-white/[0.04]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#10B98118', border: '1px solid #10B98130' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                </div>
                <h2 className="text-base font-bold text-white">Quick Tips to Boost Your Score</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { tip: "Automate savings — set up automatic transfers on payday so you save before you spend.", color: "#10B981" },
                  { tip: "Stick to the 50/30/20 rule — 50% needs, 30% wants, 20% savings & debt payoff.", color: "#3B82F6" },
                  { tip: "Pay bills on time — even one late payment can drag your score down significantly.", color: "#F59E0B" },
                  { tip: "Review subscriptions monthly — cancel anything you haven't used in the past 30 days.", color: "#6366F1" },
                  { tip: "Build an emergency fund first — aim for at least 3 months of essential expenses.", color: "#E50914" },
                  { tip: "Connect your bank — auto-synced data gives a more accurate and up-to-date score.", color: "#ff4555" },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: `${t.color}06`, borderLeft: `3px solid ${t.color}` }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <p className="text-xs text-gray-400 leading-relaxed">{t.tip}</p>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
