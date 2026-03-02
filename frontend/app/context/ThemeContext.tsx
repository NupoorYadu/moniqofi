"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const ACCENT_PRESETS = [
  { name: "Red", value: "#E50914", glow: "rgba(229,9,20,0.35)" },
  { name: "Indigo", value: "#6366F1", glow: "rgba(99,102,241,0.35)" },
  { name: "Emerald", value: "#10B981", glow: "rgba(16,185,129,0.35)" },
  { name: "Amber", value: "#F59E0B", glow: "rgba(245,158,11,0.35)" },
  { name: "Violet", value: "#a78bfa", glow: "rgba(167,139,250,0.35)" },
  { name: "Cyan", value: "#38bdf8", glow: "rgba(56,189,248,0.35)" },
];

interface ThemeCtx {
  accent: string;
  accentGlow: string;
  setAccent: (color: string) => void;
}

const ThemeContext = createContext<ThemeCtx>({
  accent: "#E50914",
  accentGlow: "rgba(229,9,20,0.35)",
  setAccent: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState("#E50914");

  useEffect(() => {
    const saved = localStorage.getItem("moniqofi_accent");
    if (saved) {
      setAccentState(saved);
      document.documentElement.style.setProperty("--accent", saved);
    }
  }, []);

  const setAccent = (color: string) => {
    setAccentState(color);
    localStorage.setItem("moniqofi_accent", color);
    document.documentElement.style.setProperty("--accent", color);
  };

  const preset = ACCENT_PRESETS.find(p => p.value === accent);
  const accentGlow = preset?.glow ?? "rgba(229,9,20,0.35)";

  return (
    <ThemeContext.Provider value={{ accent, accentGlow, setAccent }}>
      {/* Inject CSS variable globally */}
      <style>{`:root { --accent: ${accent}; }`}</style>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
