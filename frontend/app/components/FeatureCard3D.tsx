"use client";

import React from "react";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";

/* ═══════════════════════════════════════════
   PERSONALITY — Radar / Pentagon Chart
   ═══════════════════════════════════════════ */
function PersonalityVisual() {
  const cx = 100, cy = 95, R = 55, n = 5;
  const values = [0.9, 0.65, 0.8, 0.5, 0.75];

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
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E50914]/20 via-[#130202] to-[#E50914]/8" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-full bg-[#E50914]/20 blur-3xl fcard-pulse" />
      </div>

      <svg viewBox="0 0 200 190" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="pg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E50914" stopOpacity=".25" />
            <stop offset="100%" stopColor="#E50914" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pf" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4555" stopOpacity=".45" />
            <stop offset="100%" stopColor="#E50914" stopOpacity=".08" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r="80" fill="url(#pg)" />

        {/* Grid shells */}
        {[0.33, 0.66, 1].map((s, i) => (
          <path key={i} d={poly(s)} fill="none" stroke="#E50914" strokeWidth=".5" opacity={.12 + i * .06} />
        ))}

        {/* Axes */}
        {Array.from({ length: n }, (_, i) => {
          const [ex, ey] = v(i, R);
          return <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="#E50914" strokeWidth=".5" opacity=".2" />;
        })}

        {/* Data fill */}
        <motion.path
          d={dataPath} fill="url(#pf)" stroke="#FF4555" strokeWidth="1.5"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8, delay: .3 }}
        />

        {/* Vertex dots */}
        {values.map((val, i) => {
          const [x, y] = v(i, R * val);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="7" fill="#E50914" opacity=".15"
                className="fcard-node-pulse" style={{ animationDelay: `${i * .4}s` }} />
              <motion.circle cx={x} cy={y} r="3.5" fill="#FF6B7A" stroke="#E50914" strokeWidth="1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 + i * .12 }} />
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r="2.5" fill="#E50914" opacity=".5" />

        {/* Trait labels */}
        {["Saver", "Spender", "Planner", "Risk", "Social"].map((t, i) => {
          const [x, y] = v(i, R + 16);
          return (
            <text key={i} x={x} y={y + 3} textAnchor="middle" fill="#E50914" fontSize="6" opacity=".45" fontFamily="sans-serif">{t}</text>
          );
        })}

        <circle cx={cx} cy={cy} r="72" fill="none" stroke="#E50914" strokeWidth=".4" opacity=".08"
          strokeDasharray="3 6" className="fcard-spin" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SIMULATION — Wealth Projection Chart
   ═══════════════════════════════════════════ */
function SimulationVisual() {
  const pts: [number, number][] = [
    [20, 142], [38, 128], [54, 132], [72, 112], [90, 102],
    [108, 88], [124, 92], [142, 68], [162, 52], [180, 36],
  ];
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = line + " L180,158 L20,158 Z";

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/20 via-[#08081a] to-[#818CF8]/8" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: "-15%" }}>
        <div className="w-36 h-36 rounded-full bg-[#6366F1]/15 blur-3xl fcard-pulse" />
      </div>

      <svg viewBox="0 0 200 190" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="slg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C4B5FD" />
          </linearGradient>
          <linearGradient id="sag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity=".3" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity=".02" />
          </linearGradient>
          <filter id="sg">
            <feGaussianBlur stdDeviation="2.5" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Horizontal grid */}
        {[55, 85, 115, 145].map((y, i) => (
          <line key={`h${i}`} x1="20" y1={y} x2="180" y2={y} stroke="#6366F1" strokeWidth=".3" opacity=".12" />
        ))}
        {/* Vertical grid */}
        {[45, 75, 105, 135, 165].map((x, i) => (
          <line key={`v${i}`} x1={x} y1="30" x2={x} y2="158" stroke="#6366F1" strokeWidth=".3" opacity=".08" />
        ))}

        {/* Area fill */}
        <motion.path d={area} fill="url(#sag)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: .4 }} />

        {/* Main line with glow */}
        <motion.path d={line} fill="none" stroke="url(#slg)" strokeWidth="2.5" strokeLinecap="round" filter="url(#sg)"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, delay: .3, ease: "easeOut" }} />

        {/* Data dots */}
        {pts.map(([x, y], i) => (
          <motion.circle key={i} cx={x} cy={y} r="2.5" fill="#C4B5FD" stroke="#6366F1" strokeWidth="1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .3 + i * .15 }} />
        ))}

        {/* Projection arrow */}
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
          <line x1="180" y1="36" x2="188" y2="22" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" opacity=".5" strokeDasharray="3 3" />
          <polygon points="186,15 190,24 182,24" fill="#A5B4FC" opacity=".5" />
        </motion.g>

        {/* Year markers */}
        <text x="22" y="172" fill="#6366F1" fontSize="7" opacity=".35" fontFamily="sans-serif">Now</text>
        <text x="88" y="172" fill="#6366F1" fontSize="7" opacity=".35" fontFamily="sans-serif">15 yr</text>
        <text x="160" y="172" fill="#6366F1" fontSize="7" opacity=".35" fontFamily="sans-serif">30 yr</text>

        <circle cx="100" cy="95" r="88" fill="none" stroke="#6366F1" strokeWidth=".4" opacity=".06"
          strokeDasharray="2 7" className="fcard-spin-r" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUBSCRIPTIONS — Radar Sweep Scanner
   ═══════════════════════════════════════════ */
function SubscriptionVisual() {
  const cx = 100, cy = 95;
  const blips = [
    { a: 35, d: 40, s: 6 },
    { a: 135, d: 55, s: 5 },
    { a: 210, d: 30, s: 7 },
    { a: 290, d: 50, s: 5 },
    { a: 170, d: 62, s: 4 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/18 via-[#151005] to-[#F59E0B]/8" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-full bg-[#F59E0B]/15 blur-3xl fcard-pulse" />
      </div>

      <svg viewBox="0 0 200 190" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="ug" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity=".18" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="usw" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity=".3" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cy} r="80" fill="url(#ug)" />

        {/* Concentric rings */}
        {[25, 45, 65].map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke="#F59E0B" strokeWidth=".6" opacity={.1 + i * .05} />
        ))}

        {/* Crosshairs */}
        <line x1={cx} y1={cy - 70} x2={cx} y2={cy + 70} stroke="#F59E0B" strokeWidth=".4" opacity=".12" />
        <line x1={cx - 70} y1={cy} x2={cx + 70} y2={cy} stroke="#F59E0B" strokeWidth=".4" opacity=".12" />

        {/* Rotating sweep */}
        <g className="fcard-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path d={`M${cx},${cy} L${cx},${cy - 65} A65,65 0 0,1 ${cx + 46},${cy - 46} Z`}
            fill="url(#usw)" opacity=".6" />
          <line x1={cx} y1={cy} x2={cx} y2={cy - 65} stroke="#FCD34D" strokeWidth="1.2" opacity=".7" />
        </g>

        {/* Detected subscriptions */}
        {blips.map((b, i) => {
          const rad = (b.a * Math.PI) / 180;
          const x = cx + b.d * Math.cos(rad), y = cy + b.d * Math.sin(rad);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={b.s + 4} fill="#F59E0B" opacity=".12"
                className="fcard-node-pulse" style={{ animationDelay: `${i * .5}s` }} />
              <motion.circle cx={x} cy={y} r={b.s} fill="#FCD34D" stroke="#F59E0B" strokeWidth="1"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .6 + i * .18 }} />
              {b.s >= 6 && (
                <text x={x} y={y + 3} textAnchor="middle" fill="#78350F" fontSize="7" fontWeight="bold"
                  style={{ pointerEvents: "none" }}>$</text>
              )}
            </g>
          );
        })}

        {/* Center pulse */}
        <circle cx={cx} cy={cy} r="4" fill="#FCD34D" className="fcard-center-pulse" />
        <circle cx={cx} cy={cy} r="2" fill="#F59E0B" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   AI COACH — Neural Network
   ═══════════════════════════════════════════ */
function CoachVisual() {
  const cx = 100, cy = 90;
  const nodes = [
    { x: 100, y: 90, r: 8 },
    { x: 72, y: 68, r: 5 }, { x: 128, y: 68, r: 5 },
    { x: 66, y: 102, r: 5 }, { x: 134, y: 102, r: 5 },
    { x: 82, y: 122, r: 4 }, { x: 118, y: 122, r: 4 },
    { x: 52, y: 52, r: 3 }, { x: 148, y: 52, r: 3 },
    { x: 46, y: 112, r: 3 }, { x: 154, y: 112, r: 3 },
    { x: 100, y: 142, r: 3 },
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
    [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6],
    [1, 7], [2, 8], [3, 9], [4, 10], [5, 11], [6, 11],
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#10B981]/18 via-[#031a10] to-[#10B981]/8" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-36 h-36 rounded-full bg-[#10B981]/15 blur-3xl fcard-pulse" />
      </div>

      <svg viewBox="0 0 200 190" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="cg" cx="50%" cy="47%" r="42%">
            <stop offset="0%" stopColor="#10B981" stopOpacity=".2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r="72" fill="url(#cg)" />

        {/* Connection edges */}
        {edges.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y}
            stroke="#10B981" strokeWidth=".7" opacity=".18"
            className="fcard-edge" style={{ animationDelay: `${i * .18}s` }} />
        ))}

        {/* Signal pulses along key edges */}
        {[0, 2, 5].map((idx) => {
          const [a, b] = edges[idx];
          return (
            <circle key={`sig${idx}`} r="2.5" fill="#6EE7B7" opacity="0">
              <animate attributeName="cx" values={`${nodes[a].x};${nodes[b].x};${nodes[a].x}`}
                dur="2.5s" repeatCount="indefinite" begin={`${idx * .7}s`} />
              <animate attributeName="cy" values={`${nodes[a].y};${nodes[b].y};${nodes[a].y}`}
                dur="2.5s" repeatCount="indefinite" begin={`${idx * .7}s`} />
              <animate attributeName="opacity" values="0;.7;0"
                dur="2.5s" repeatCount="indefinite" begin={`${idx * .7}s`} />
            </circle>
          );
        })}

        {/* Radiating waves from center */}
        {[0, 1, 2].map((i) => (
          <circle key={`rad${i}`} cx={cx} cy={cy} r="12" fill="none" stroke="#10B981" strokeWidth=".6"
            className="fcard-radiate" style={{ animationDelay: `${i}s` }} />
        ))}

        {/* Neural nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.r + 3} fill="#10B981" opacity=".08"
              className="fcard-node-pulse" style={{ animationDelay: `${i * .2}s` }} />
            <motion.circle cx={n.x} cy={n.y} r={n.r} fill={i === 0 ? "#34D399" : "#10B981"}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 + i * .08 }} />
            <circle cx={n.x} cy={n.y} r={n.r * .45} fill="#6EE7B7" opacity=".6" />
          </g>
        ))}

        <circle cx={cx} cy={cy} r="80" fill="none" stroke="#10B981" strokeWidth=".4" opacity=".06"
          strokeDasharray="2 6" className="fcard-spin" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CARD WRAPPER
   ═══════════════════════════════════════════ */
export interface Feature3DCardProps {
  href: string;
  label: string;
  sub: string;
  stat: string;
  color: string;
  scene: "personality" | "simulation" | "subscriptions" | "coach";
  index: number;
}

const visuals = {
  personality: PersonalityVisual,
  simulation: SimulationVisual,
  subscriptions: SubscriptionVisual,
  coach: CoachVisual,
};

export default function FeatureCard3D({ label, sub, stat, color, scene, index }: Feature3DCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 20 });
  const sy = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(sy, [-0.5, 0.5], ["6deg", "-6deg"]);
  const rotateY = useTransform(sx, [-0.5, 0.5], ["-6deg", "6deg"]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  const Visual = visuals[scene];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, type: "spring", stiffness: 100 }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.03 }}
      className="feature-card-3d group relative cursor-pointer rounded-2xl"
    >
      {/* Animated border */}
      <div className="feature-border rounded-2xl" style={{ "--card-color": color } as React.CSSProperties} />

      {/* Card background */}
      <div className="absolute inset-0 rounded-2xl bg-[#111111]" />

      {/* Colored top glow */}
      <div className="absolute inset-0 rounded-2xl" style={{ background: `linear-gradient(180deg, ${color}18 0%, transparent 60%)` }} />

      {/* Visual illustration */}
      <div className="relative h-44 w-full overflow-hidden rounded-t-2xl">
        <div className="absolute bottom-0 left-0 right-0 h-10 z-10"
          style={{ background: "linear-gradient(to bottom, transparent, #111111)" }} />
        <Visual />
      </div>

      {/* Content */}
      <div className="relative px-5 pb-5 pt-1 z-20">
        <div className="mb-2">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
            style={{ color, background: `${color}20`, border: `1px solid ${color}35` }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
            {stat}
          </span>
        </div>
        <h3 className="font-extrabold text-white text-[15px] mb-1 tracking-tight">{label}</h3>
        <p className="text-[11px] text-gray-400 leading-relaxed mb-3 line-clamp-2">{sub}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: `${color}15` }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={{ width: "0%" }}
              whileInView={{ width: "65%" }}
              transition={{ duration: 1.5, delay: 0.4 + index * 0.15, ease: "easeOut" }}
            />
          </div>
          <motion.span
            className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all duration-300"
            style={{ color }}
          >
            Explore →
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
}
