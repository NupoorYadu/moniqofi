"use client";

import React from "react";
import { motion } from "framer-motion";

/* ═════════════════════════════════════════════════
   PERSONALITY — Brain / Mind Radar
   ═════════════════════════════════════════════════ */
export function PersonalityHero() {
  const cx = 130, cy = 125, R = 75, n = 5;
  const values = [0.85, 0.6, 0.78, 0.45, 0.72];
  const labels = ["Saver", "Spender", "Planner", "Risk", "Social"];

  const v = (i: number, r: number) => {
    const a = (i * 2 * Math.PI) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };

  const poly = (s: number) =>
    Array.from({ length: n }, (_, i) => v(i, R * s))
      .map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`)
      .join(" ") + " Z";

  const dataPath = values
    .map((val, i) => v(i, R * val))
    .map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`)
    .join(" ") + " Z";

  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/12 via-[#0A0A0A] to-[#E50914]/6" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full bg-[#E50914]/10 blur-[80px]" />

      <svg viewBox="0 0 260 250" className="absolute right-0 top-0 h-full w-auto opacity-80">
        <defs>
          <radialGradient id="phg" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#E50914" stopOpacity=".15" />
            <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="phf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4555" stopOpacity=".4" />
            <stop offset="100%" stopColor="#E50914" stopOpacity=".08" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r="100" fill="url(#phg)" />

        {[0.33, 0.66, 1].map((s, i) => (
          <path key={i} d={poly(s)} fill="none" stroke="#E50914" strokeWidth=".6" opacity={.1 + i * .06} />
        ))}

        {Array.from({ length: n }, (_, i) => {
          const [ex, ey] = v(i, R);
          return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#E50914" strokeWidth=".5" opacity=".15" />;
        })}

        <motion.path d={dataPath} fill="url(#phf)" stroke="#FF4555" strokeWidth="1.8"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: .4 }} />

        {values.map((val, i) => {
          const [x, y] = v(i, R * val);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="8" fill="#E50914" opacity=".12" className="fcard-node-pulse" style={{ animationDelay: `${i * .4}s` }} />
              <motion.circle cx={x} cy={y} r="4" fill="#FF6B7A" stroke="#E50914" strokeWidth="1.2"
                initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .6 + i * .12 }} />
            </g>
          );
        })}

        {labels.map((t, i) => {
          const [x, y] = v(i, R + 20);
          return <text key={i} x={x} y={y + 3} textAnchor="middle" fill="#E50914" fontSize="8" opacity=".5" fontFamily="sans-serif">{t}</text>;
        })}

        <circle cx={cx} cy={cy} r="95" fill="none" stroke="#E50914" strokeWidth=".4" opacity=".06" strokeDasharray="3 6" className="fcard-spin" />
      </svg>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
          className="text-xs uppercase tracking-[.2em] text-[#E50914]/70 font-semibold mb-2">AI Analysis</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 }}
          className="text-3xl font-bold text-white">Financial<br/><span className="gradient-text">Personality</span></motion.h2>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   SIMULATION — Wealth Chart Rise
   ═════════════════════════════════════════════════ */
export function SimulationHero() {
  const pts: [number, number][] = [
    [30, 180], [55, 165], [80, 170], [105, 148], [130, 130],
    [155, 108], [180, 118], [205, 85], [230, 60], [255, 40],
  ];
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = line + " L255,200 L30,200 Z";

  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/12 via-[#0A0A0A] to-[#818CF8]/6" />
      <div className="absolute top-1/2 right-1/4 w-60 h-60 rounded-full bg-[#6366F1]/10 blur-[80px]" />

      <svg viewBox="0 0 280 220" className="absolute right-0 top-0 h-full w-auto opacity-80">
        <defs>
          <linearGradient id="shg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
          <linearGradient id="sha" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity=".25" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity=".02" />
          </linearGradient>
          <filter id="shgl">
            <feGaussianBlur stdDeviation="3" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {[80, 120, 160].map((y, i) => (
          <line key={i} x1="30" y1={y} x2="255" y2={y} stroke="#6366F1" strokeWidth=".3" opacity=".1" />
        ))}

        <motion.path d={area} fill="url(#sha)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: .5 }} />

        <motion.path d={line} fill="none" stroke="url(#shg)" strokeWidth="2.5" strokeLinecap="round" filter="url(#shgl)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.5, delay: .3, ease: "easeOut" }} />

        {pts.map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r="3" fill="#C4B5FD" stroke="#6366F1" strokeWidth="1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 + i * .2 }} />
        ))}

        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
          <line x1="255" y1="40" x2="268" y2="22" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" opacity=".5" strokeDasharray="3 3" />
          <polygon points="265,15 271,25 259,25" fill="#A5B4FC" opacity=".5" />
        </motion.g>
      </svg>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
          className="text-xs uppercase tracking-[.2em] text-[#6366F1]/70 font-semibold mb-2">Crystal Ball</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 }}
          className="text-3xl font-bold text-white">Future<br/><span className="text-[#818CF8]">You</span></motion.h2>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   SUBSCRIPTIONS — Radar Sweep Scanner
   ═════════════════════════════════════════════════ */
export function SubscriptionHero() {
  const cx = 140, cy = 115;
  const blips = [
    { a: 35, d: 48, s: 7 }, { a: 135, d: 62, s: 6 }, { a: 210, d: 38, s: 8 },
    { a: 290, d: 55, s: 5 }, { a: 170, d: 70, s: 5 }, { a: 80, d: 45, s: 6 },
  ];

  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/12 via-[#0A0A0A] to-[#F59E0B]/6" />
      <div className="absolute top-1/2 right-1/3 w-60 h-60 rounded-full bg-[#F59E0B]/10 blur-[80px]" />

      <svg viewBox="0 0 280 230" className="absolute right-0 top-0 h-full w-auto opacity-80">
        <defs>
          <radialGradient id="ubg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity=".12" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="usw2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity=".25" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r="90" fill="url(#ubg)" />

        {[30, 52, 74].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#F59E0B" strokeWidth=".6" opacity={.08 + i * .04} />
        ))}
        <line x1={cx} y1={cy - 80} x2={cx} y2={cy + 80} stroke="#F59E0B" strokeWidth=".4" opacity=".1" />
        <line x1={cx - 80} y1={cy} x2={cx + 80} y2={cy} stroke="#F59E0B" strokeWidth=".4" opacity=".1" />

        <g className="fcard-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path d={`M${cx},${cy} L${cx},${cy - 74} A74,74 0 0,1 ${cx + 52},${cy - 52} Z`}
            fill="url(#usw2)" opacity=".6" />
          <line x1={cx} y1={cy} x2={cx} y2={cy - 74} stroke="#FCD34D" strokeWidth="1.2" opacity=".7" />
        </g>

        {blips.map((b, i) => {
          const rad = (b.a * Math.PI) / 180;
          const x = cx + b.d * Math.cos(rad), y = cy + b.d * Math.sin(rad);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={b.s + 5} fill="#F59E0B" opacity=".08" className="fcard-node-pulse" style={{ animationDelay: `${i * .5}s` }} />
              <motion.circle cx={x} cy={y} r={b.s} fill="#FCD34D" stroke="#F59E0B" strokeWidth="1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 + i * .15 }} />
              {b.s >= 7 && <text x={x} y={y + 3} textAnchor="middle" fill="#78350F" fontSize="8" fontWeight="bold">$</text>}
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="5" fill="#FCD34D" className="fcard-center-pulse" />
        <circle cx={cx} cy={cy} r="2.5" fill="#F59E0B" />
      </svg>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
          className="text-xs uppercase tracking-[.2em] text-[#F59E0B]/70 font-semibold mb-2">Leak Detection</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 }}
          className="text-3xl font-bold text-white">Subscription<br/><span className="text-[#FCD34D]">Scanner</span></motion.h2>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   COACH — Neural Network Brain
   ═════════════════════════════════════════════════ */
export function CoachHero() {
  const cx = 140, cy = 110;
  const nodes = [
    { x: 140, y: 110, r: 10 },
    { x: 108, y: 82, r: 6 }, { x: 172, y: 82, r: 6 },
    { x: 96, y: 118, r: 6 }, { x: 184, y: 118, r: 6 },
    { x: 114, y: 148, r: 5 }, { x: 166, y: 148, r: 5 },
    { x: 80, y: 62, r: 4 }, { x: 200, y: 62, r: 4 },
    { x: 72, y: 130, r: 4 }, { x: 208, y: 130, r: 4 },
    { x: 140, y: 170, r: 4 },
  ];
  const edges: [number, number][] = [
    [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
    [1,2],[1,3],[2,4],[3,5],[4,6],[5,6],
    [1,7],[2,8],[3,9],[4,10],[5,11],[6,11],
  ];

  return (
    <div className="relative w-full h-44 overflow-hidden rounded-2xl mb-0">
      <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/12 via-[#0A0A0A] to-[#10B981]/6" />
      <div className="absolute top-1/2 right-1/3 w-60 h-60 rounded-full bg-[#10B981]/10 blur-[80px]" />

      <svg viewBox="0 0 280 200" className="absolute right-0 top-0 h-full w-auto opacity-80">
        <defs>
          <radialGradient id="chg" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#10B981" stopOpacity=".15" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r="85" fill="url(#chg)" />

        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="#10B981" strokeWidth=".7" opacity=".15" className="fcard-edge" style={{ animationDelay: `${i * .15}s` }} />
        ))}

        {[0, 2, 5].map((idx) => {
          const [a, b] = edges[idx];
          return (
            <circle key={`sig${idx}`} r="3" fill="#6EE7B7" opacity="0">
              <animate attributeName="cx" values={`${nodes[a].x};${nodes[b].x};${nodes[a].x}`} dur="2.5s" repeatCount="indefinite" begin={`${idx * .7}s`} />
              <animate attributeName="cy" values={`${nodes[a].y};${nodes[b].y};${nodes[a].y}`} dur="2.5s" repeatCount="indefinite" begin={`${idx * .7}s`} />
              <animate attributeName="opacity" values="0;.6;0" dur="2.5s" repeatCount="indefinite" begin={`${idx * .7}s`} />
            </circle>
          );
        })}

        {[0, 1, 2].map((i) => (
          <circle key={`rad${i}`} cx={cx} cy={cy} r="14" fill="none" stroke="#10B981" strokeWidth=".6"
            className="fcard-radiate" style={{ animationDelay: `${i}s` }} />
        ))}

        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r + 4} fill="#10B981" opacity=".06" className="fcard-node-pulse" style={{ animationDelay: `${i * .15}s` }} />
            <motion.circle cx={n.x} cy={n.y} r={n.r} fill={i === 0 ? "#34D399" : "#10B981"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 + i * .06 }} />
            <circle cx={n.x} cy={n.y} r={n.r * .4} fill="#6EE7B7" opacity=".55" />
          </g>
        ))}
      </svg>

      <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 }}
          className="text-xs uppercase tracking-[.2em] text-[#10B981]/70 font-semibold mb-1">Neural Powered</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
          className="text-2xl font-bold text-white">AI Financial<br/><span className="text-[#34D399]">Coach</span></motion.h2>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   GOALS — Target / Bullseye
   ═════════════════════════════════════════════════ */
export function GoalsHero() {
  const cx = 140, cy = 115;

  return (
    <div className="relative w-full h-56 overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/12 via-[#0A0A0A] to-[#6366F1]/6" />
      <div className="absolute top-1/2 right-1/3 w-60 h-60 rounded-full bg-[#6366F1]/10 blur-[80px]" />

      <svg viewBox="0 0 280 230" className="absolute right-0 top-0 h-full w-auto opacity-80">
        <defs>
          <radialGradient id="gbg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity=".15" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r="90" fill="url(#gbg)" />

        {/* Target rings */}
        {[70, 52, 34, 16].map((r, i) => (
          <motion.circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={i % 2 === 0 ? "#6366F1" : "#818CF8"} strokeWidth={i === 0 ? "1" : "1.5"}
            opacity={.15 + i * .1}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: .3 + i * .15, type: "spring", stiffness: 100 }}
            style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" }} />
        ))}

        {/* Alternating fills */}
        {[70, 52, 34].map((r, i) => {
          const inner = [52, 34, 16][i];
          return (
            <motion.circle key={`f${i}`} cx={cx} cy={cy} r={(r + inner) / 2}
              fill={i % 2 === 0 ? "#6366F1" : "#818CF8"} opacity={.04 + i * .02}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: .4 + i * .15 }}
              style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" }}
            />
          );
        })}

        {/* Bullseye center */}
        <motion.circle cx={cx} cy={cy} r="8" fill="#6366F1"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: .8, type: "spring" }}
          style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" }} />
        <circle cx={cx} cy={cy} r="4" fill="#A5B4FC" opacity=".8" />

        {/* Center pulse */}
        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#6366F1" strokeWidth="1" className="fcard-radiate" />
        <circle cx={cx} cy={cy} r="10" fill="none" stroke="#6366F1" strokeWidth="1" className="fcard-radiate" style={{ animationDelay: "1s" }} />

        {/* Arrow */}
        <motion.g initial={{ opacity: 0, x: 60, y: -60 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ delay: 1, duration: .6, type: "spring" }}>
          <line x1={cx + 4} y1={cy - 4} x2={cx + 60} y2={cy - 60} stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
          <polygon points={`${cx + 2},${cy - 2} ${cx + 12},${cy - 2} ${cx + 2},${cy - 12}`} fill="#A5B4FC" />
          {/* Feather lines */}
          <line x1={cx + 50} y1={cy - 50} x2={cx + 62} y2={cy - 44} stroke="#818CF8" strokeWidth="1" opacity=".5" />
          <line x1={cx + 52} y1={cy - 52} x2={cx + 46} y2={cy - 64} stroke="#818CF8" strokeWidth="1" opacity=".5" />
        </motion.g>

        {/* Progress arcs representing goals */}
        {[
          { r: 85, pct: .7, color: "#10B981", delay: 1.2 },
          { r: 85, pct: .45, color: "#F59E0B", delay: 1.4, offset: 260 },
        ].map((arc, i) => {
          const circ = 2 * Math.PI * arc.r;
          return (
            <motion.circle key={i} cx={cx} cy={cy} r={arc.r} fill="none"
              stroke={arc.color} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - arc.pct) }}
              transition={{ duration: 2, delay: arc.delay, ease: "easeOut" }}
              style={{
                transform: `rotate(${arc.offset || 0}deg)`,
                transformOrigin: `${cx}px ${cy}px`,
                transformBox: "fill-box",
                filter: `drop-shadow(0 0 4px ${arc.color}50)`,
              }}
            />
          );
        })}
      </svg>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
          className="text-xs uppercase tracking-[.2em] text-[#6366F1]/70 font-semibold mb-2">Target Tracker</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .4 }}
          className="text-3xl font-bold text-white">Savings<br/><span className="text-[#A5B4FC]">Goals</span></motion.h2>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   HEALTH SCORE — Heartbeat / Pulse Monitor
   ═════════════════════════════════════════════════ */
export function HealthScoreHero({ score, color }: { score: number; color: string }) {
  // ECG-style heartbeat path
  const ecg = "M0,100 L30,100 L40,100 L50,80 L55,120 L60,60 L65,140 L70,75 L80,100 L110,100 L120,100 L130,80 L135,120 L140,60 L145,140 L150,75 L160,100 L190,100 L200,100 L210,80 L215,120 L220,60 L225,140 L230,75 L240,100 L280,100";

  return (
    <div className="relative w-full h-44 overflow-hidden rounded-2xl mb-8">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}12, #0A0A0A, ${color}06)` }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full blur-[80px]"
        style={{ background: `${color}10` }} />

      <svg viewBox="0 0 280 200" className="absolute inset-0 w-full h-full opacity-60">
        <defs>
          <filter id="ecggl">
            <feGaussianBlur stdDeviation="2" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ECG line */}
        <motion.path d={ecg} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" filter="url(#ecggl)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }} />

        {/* Horizontal base */}
        <line x1="0" y1="100" x2="280" y2="100" stroke={color} strokeWidth=".3" opacity=".1" />
      </svg>

      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10">
        <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .2 }}
          className="text-xs uppercase tracking-[.2em] font-semibold mb-2" style={{ color: `${color}90` }}>Wellness Check</motion.p>
        <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .3 }}
          className="text-3xl font-bold text-white">Financial<br/><span style={{ color }}>Health</span></motion.h2>
      </div>

      <div className="absolute right-8 top-1/2 -translate-y-1/2 z-10">
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: .5, type: "spring" }}
          className="text-6xl font-black" style={{ color }}
        >
          {score}
        </motion.div>
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════
   DECORATIVE SECTION DIVIDER (reusable)
   ═════════════════════════════════════════════════ */
export function SectionDivider({ color = "#E50914" }: { color?: string }) {
  return (
    <div className="flex items-center gap-3 my-6 mx-auto max-w-xs">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${color}30, transparent)` }} />
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{ background: i === 1 ? color : `${color}50`, width: i === 1 ? 6 : 4, height: i === 1 ? 6 : 4 }}
            animate={{ opacity: [.4, 1, .4] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * .3 }}
          />
        ))}
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${color}30, transparent)` }} />
    </div>
  );
}

/* ═════════════════════════════════════════════════
   LOGIN / AUTH — Floating Shield
   ═════════════════════════════════════════════════ */
export function AuthVisual() {
  return (
    <div className="relative w-full h-48 flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-44 h-44 opacity-40">
        <defs>
          <linearGradient id="avsg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E50914" stopOpacity=".5" />
            <stop offset="100%" stopColor="#E50914" stopOpacity=".1" />
          </linearGradient>
        </defs>

        {/* Shield body */}
        <motion.path
          d="M100,20 L170,50 L170,100 Q170,160 100,185 Q30,160 30,100 L30,50 Z"
          fill="url(#avsg)" stroke="#E50914" strokeWidth="1.5" opacity=".8"
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: .8 }}
          transition={{ duration: .8, type: "spring" }}
          style={{ transformOrigin: "100px 100px", transformBox: "fill-box" }}
        />

        {/* Lock icon */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}>
          <rect x="82" y="95" width="36" height="30" rx="4" fill="#E50914" opacity=".6" />
          <path d="M88,95 L88,82 A12,12 0 0,1 112,82 L112,95" fill="none" stroke="#FF6B7A" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="110" r="4" fill="#FF6B7A" />
          <line x1="100" y1="114" x2="100" y2="120" stroke="#FF6B7A" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>

        <circle cx="100" cy="100" r="90" fill="none" stroke="#E50914" strokeWidth=".5" opacity=".08" strokeDasharray="3 6" className="fcard-spin" />
      </svg>
    </div>
  );
}
