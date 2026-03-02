import React from "react";
import Svg, { Circle, Path, Rect, Line, G, Polyline } from "react-native-svg";

/**
 * MoniqoFi brand logo — wallet icon with banknotes, coin & chart.
 * Usage: <MoniqoLogo size={40} />
 */
export default function MoniqoLogo({ size = 40 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* Back banknote — teal, angled left */}
      <G transform="rotate(-15 30 35)">
        <Rect x="10" y="6" width="38" height="56" rx="6" fill="#2DD4BF" />
        <Rect x="17" y="18" width="24" height="2.5" rx="1.2" fill="#fff" opacity="0.35" />
        <Rect x="17" y="24" width="17" height="2" rx="1" fill="#fff" opacity="0.2" />
        <Rect x="17" y="44" width="24" height="2" rx="1" fill="#fff" opacity="0.15" />
      </G>

      {/* Front banknote — mint green, slight angle */}
      <G transform="rotate(6 52 26)">
        <Rect x="34" y="2" width="34" height="52" rx="6" fill="#86EFAC" />
        <Rect x="41" y="14" width="20" height="2.5" rx="1.2" fill="#fff" opacity="0.35" />
        <Rect x="41" y="20" width="14" height="2" rx="1" fill="#fff" opacity="0.2" />
        <Rect x="41" y="36" width="20" height="2" rx="1" fill="#fff" opacity="0.15" />
      </G>

      {/* Gold coin */}
      <Circle cx="84" cy="22" r="18" fill="#FBBF24" />
      <Circle cx="84" cy="22" r="14" fill="none" stroke="#D97706" strokeWidth="2" />
      <Circle cx="84" cy="22" r="8" fill="none" stroke="#D97706" strokeWidth="1" opacity="0.4" />
      {/* Dollar accent on coin */}
      <Path
        d="M82.5 15V16.5M82.5 27.5V29M80 18.5C80 17.1 81.2 16 82.7 16H83.3C84.8 16 86 17.1 86 18.5C86 19.9 84.8 21 83.3 21H82C80.6 21 79.5 22.1 79.5 23.5C79.5 24.9 80.6 26 82 26H83C84.4 26 85.5 24.9 85.5 23.5"
        stroke="#D97706"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Wallet body */}
      <Rect x="6" y="44" width="86" height="62" rx="12" fill="#1E293B" />
      {/* Wallet top band */}
      <Path d="M6 56C6 49.4 11.4 44 18 44H80C86.6 44 92 49.4 92 56V58H6V56Z" fill="#334155" />

      {/* Uptrend chart line */}
      <Polyline
        points="18,92 26,86 34,89 44,78 52,82 60,73"
        stroke="#10B981"
        strokeWidth="2.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="60" cy="73" r="3" fill="#10B981" />
      <Circle cx="60" cy="73" r="1.2" fill="#fff" />

      {/* Decorative fintech circuit dots */}
      <Circle cx="74" cy="90" r="2.2" fill="#FBBF24" opacity="0.55" />
      <Circle cx="82" cy="82" r="1.8" fill="#FBBF24" opacity="0.4" />
      <Line x1="74" y1="90" x2="82" y2="82" stroke="#FBBF24" strokeWidth="0.9" opacity="0.35" />
      <Circle cx="86" cy="94" r="1.2" fill="#FBBF24" opacity="0.3" />
      <Line x1="74" y1="90" x2="86" y2="94" stroke="#FBBF24" strokeWidth="0.6" opacity="0.2" />
    </Svg>
  );
}
