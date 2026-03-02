"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Animated gauge/speedometer chart — visually striking score display.
 * Used for savings rate, budget utilization, etc.
 */
export function GaugeChart({
  value,
  max = 100,
  label,
  sublabel,
  size = 180,
  strokeWidth = 12,
  color = "#E50914",
}: {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const halfCircumference = Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const displayValue = Math.round(pct * 100);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        {/* Background arc (half circle) */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Animated value arc */}
        <motion.path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={halfCircumference}
          initial={{ strokeDashoffset: halfCircumference }}
          animate={{ strokeDashoffset: halfCircumference * (1 - pct) }}
          transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
        {/* Center value */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          fill={color}
          fontSize="28"
          fontWeight="800"
        >
          {displayValue}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          fill="#888"
          fontSize="11"
        >
          {label}
        </text>
      </svg>
      {sublabel && (
        <span className="text-xs text-gray-600 mt-1">{sublabel}</span>
      )}
    </div>
  );
}

/**
 * Animated horizontal bar ranking — for top spending categories etc.
 */
export function RankingBars({
  data,
  maxValue,
  onItemClick,
}: {
  data: { label: string; value: number; color: string }[];
  maxValue?: number;
  onItemClick?: (label: string) => void;
}) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          onClick={() => onItemClick?.(item.label)}
          className={onItemClick ? "cursor-pointer group" : ""}
          whileHover={onItemClick ? { x: 4 } : {}}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: item.color }}
              />
              <span className={`text-sm ${onItemClick ? "text-white group-hover:underline" : "text-gray-300"}`}>{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-400">
                ₹{item.value.toLocaleString("en-IN")}
              </span>
              {onItemClick && <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition">→</span>}
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                boxShadow: `0 0 8px ${item.color}40`,
              }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 1.2, delay: 0.5 + i * 0.1, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Animated counter that counts up from 0 to target.
 */
export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = 2,
  className = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  decimals?: number;
}) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {prefix}
      </motion.span>
      <CounterValue value={value} duration={duration} decimals={decimals} />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: duration }}
      >
        {suffix}
      </motion.span>
    </motion.span>
  );
}

function CounterValue({
  value,
  duration,
  decimals,
}: {
  value: number;
  duration: number;
  decimals: number;
}) {
  const [displayVal, setDisplayVal] = useState("0");

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * value;
      setDisplayVal(
        current.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration, decimals]);

  return <>{displayVal}</>;
}

/**
 * Mini sparkline chart — lightweight inline trend indicator.
 */
export function Sparkline({
  data,
  color = "#E50914",
  width = 100,
  height = 30,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <motion.polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace("#", "")})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />
      {/* Line */}
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      {/* Endpoint dot */}
      <motion.circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5"
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5 }}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
