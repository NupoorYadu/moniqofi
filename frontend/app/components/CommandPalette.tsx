"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: JSX.Element;
  action: () => void;
  category: string;
  keywords?: string;
}

const NAV_ICON = (path: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const go = useCallback((path: string) => { router.push(path); setOpen(false); }, [router]);

  const COMMANDS: CommandItem[] = [
    { id: "dashboard",  label: "Dashboard",          description: "Overview of finances",      icon: NAV_ICON("M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"),    action: () => go("/dashboard"),    category: "Navigate", keywords: "home overview" },
    { id: "health",     label: "Financial Health",   description: "Health score & breakdown",   icon: NAV_ICON("M22 12h-4l-3 9L9 3l-3 9H2"),                         action: () => go("/health-score"), category: "Navigate", keywords: "score wellness" },
    { id: "budget",     label: "Budget",             description: "Budget tracker",             icon: NAV_ICON("M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"), action: () => go("/budgets"), category: "Navigate", keywords: "spend" },
    { id: "goals",      label: "Goals",              description: "Savings & financial goals",  icon: NAV_ICON("M22 11.08V12a10 10 0 1 1-5.93-9.14"),                action: () => go("/goals"),        category: "Navigate", keywords: "saving target" },
    { id: "coach",      label: "AI Coach",           description: "Personal finance coach",     icon: NAV_ICON("M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"), action: () => go("/coach"), category: "Navigate", keywords: "ai advice chat" },
    { id: "personality",label: "Money Personality",  description: "Personality type analysis",  icon: NAV_ICON("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"), action: () => go("/personality"), category: "Navigate", keywords: "type trait" },
    { id: "simulation", label: "Simulation",         description: "Financial scenario modeler", icon: NAV_ICON("M18 20V10M12 20V4M6 20v-6"),                          action: () => go("/simulation"),   category: "Navigate", keywords: "forecast model" },
    { id: "subs",       label: "Subscriptions",      description: "Manage subscriptions",       icon: NAV_ICON("M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"), action: () => go("/subscriptions"), category: "Navigate", keywords: "bills recurring" },
    { id: "logout",     label: "Log Out",            description: "Sign out of MoniqoFi",       icon: NAV_ICON("M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"), action: () => { localStorage.removeItem("token"); router.push("/login"); setOpen(false); }, category: "Account", keywords: "sign signout" },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(query.toLowerCase()) ||
        (c.keywords || "").toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  const grouped: Record<string, CommandItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  // Ctrl+K / Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setOpen(prev => !prev); setQuery(""); setSelected(0); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(p => Math.min(p + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(p => Math.max(p - 1, 0)); }
      if (e.key === "Enter" && filtered[selected]) { filtered[selected].action(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selected]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 60); }, [open]);
  useEffect(() => { setSelected(0); }, [query]);

  let flatIdx = 0;

  return (
    <>
      {/* Trigger hint in sidebar-like area */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9000] flex items-start justify-center pt-[18vh]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ background: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "#0e0e0e", border: "1px solid rgba(255,255,255,0.09)" }}
              initial={{ opacity: 0, scale: 0.94, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search pages, actions…"
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                />
                <kbd className="text-[10px] text-gray-600 px-2 py-1 rounded-md" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-600 text-sm">No results for "{query}"</div>
                ) : (
                  Object.entries(grouped).map(([cat, items]) => (
                    <div key={cat}>
                      <div className="px-5 py-2 text-[10px] uppercase tracking-widest text-gray-600">{cat}</div>
                      {items.map(item => {
                        const idx = flatIdx++;
                        const isSelected = idx === selected;
                        return (
                          <button key={item.id}
                            className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors"
                            style={{ background: isSelected ? "rgba(229,9,20,0.10)" : "transparent" }}
                            onMouseEnter={() => setSelected(idx)}
                            onClick={item.action}
                          >
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: isSelected ? "rgba(229,9,20,0.20)" : "rgba(255,255,255,0.05)", color: isSelected ? "#E50914" : "#666", border: isSelected ? "1px solid rgba(229,9,20,0.35)" : "1px solid transparent" }}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold" style={{ color: isSelected ? "#fff" : "#bbb" }}>{item.label}</div>
                              {item.description && <div className="text-xs text-gray-600 truncate">{item.description}</div>}
                            </div>
                            {isSelected && (
                              <kbd className="text-[10px] text-gray-500 px-2 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)" }}>↵</kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer hint */}
              <div className="px-5 py-3 border-t border-white/[0.06] flex items-center gap-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                {[["↑↓", "navigate"], ["↵", "open"], ["esc", "close"]].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <kbd className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>{key}</kbd>
                    <span className="text-[10px] text-gray-600">{label}</span>
                  </div>
                ))}
                <div className="ml-auto text-[10px] text-gray-700">Ctrl+K to toggle</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
