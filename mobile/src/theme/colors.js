// MoniqoFi — Glassmorphic Gradient Theme
export const Colors = {
  // Primary gradient stops
  gradientStart: "#C4B5FD",   // purple-300
  gradientMid: "#93C5FD",     // blue-300
  gradientEnd: "#5EEAD4",     // teal-300

  // Accent
  purple: "#8B5CF6",
  purpleLight: "rgba(139,92,246,0.15)",
  purpleSoft: "#C4B5FD",
  blue: "#3B82F6",
  blueLight: "rgba(59,130,246,0.15)",
  teal: "#14B8A6",
  tealLight: "rgba(20,184,166,0.15)",
  emerald: "#10B981",
  emeraldLight: "rgba(16,185,129,0.15)",
  emeraldDark: "#065F46",
  red: "#EF4444",
  redLight: "rgba(239,68,68,0.12)",
  yellow: "#F59E0B",
  yellowLight: "rgba(245,158,11,0.12)",
  indigo: "#6366F1",
  orange: "#F97316",

  // Text
  textPrimary: "#1E1B4B",     // indigo-950
  textSecondary: "#6366F1",   // indigo-500 dim
  textMuted: "#94A3B8",       // slate-400
  textOnGlass: "#312E81",     // indigo-900
  textWhite: "#FFFFFF",

  // Glass surfaces
  glass: "rgba(255,255,255,0.45)",
  glassBorder: "rgba(255,255,255,0.6)",
  glassHeavy: "rgba(255,255,255,0.65)",
  glassDark: "rgba(30,27,75,0.08)",

  // Legacy compat
  bg: "transparent",
  white: "rgba(255,255,255,0.6)",
  card: "rgba(255,255,255,0.45)",
  gray50: "rgba(255,255,255,0.3)",
  gray100: "rgba(255,255,255,0.2)",
  gray200: "rgba(255,255,255,0.35)",
  gray300: "rgba(255,255,255,0.4)",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1E293B",
  gray900: "#0F172A",

  // Status
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
};

// Gradient preset arrays for LinearGradient
export const Gradients = {
  bg: ["#DDD6FE", "#BFDBFE", "#99F6E4"],           // main background
  card: ["rgba(255,255,255,0.55)", "rgba(255,255,255,0.35)"],
  purple: ["#A78BFA", "#7C3AED"],
  blue: ["#60A5FA", "#3B82F6"],
  teal: ["#5EEAD4", "#14B8A6"],
  emerald: ["#6EE7B7", "#10B981"],
  danger: ["#FCA5A5", "#EF4444"],
  dark: ["#1E293B", "#0F172A"],
};

export const Glass = {
  card: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 20,
  },
  heavy: {
    backgroundColor: Colors.glassHeavy,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: 20,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
  },
};

export const Shadows = {
  sm: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: "#A78BFA",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};
