"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../lib/api";

const API = API_BASE;
const CUSTOM_KEY = "moniqofi_custom_prompts";

const PRESET_CATEGORIES = [
  {
    label: "💰 Budgets",
    items: [
      "Am I over budget this month?",
      "Which budget category am I closest to exceeding?",
      "How much budget do I have left overall?",
      "Should I increase my food budget?",
    ],
  },
  {
    label: "📊 Spending",
    items: [
      "Where's most of my money going?",
      "Which category should I cut back on?",
      "How does my spending compare to last month?",
      "What's my biggest unnecessary expense?",
    ],
  },
  {
    label: "🎯 Goals",
    items: [
      "Am I on track for my savings goals?",
      "How long until I reach my goal?",
      "What's slowing down my goal progress?",
      "Which goal should I prioritize?",
    ],
  },
  {
    label: "📈 Savings",
    items: [
      "How's my savings rate?",
      "Any tips to save more this month?",
      "How much should I be saving monthly?",
      "What's my monthly surplus or deficit?",
    ],
  },
  {
    label: "🧠 Insights",
    items: [
      "Give me a full financial summary",
      "What's my biggest financial risk right now?",
      "Am I financially healthy?",
      "What should I focus on to improve my finances?",
    ],
  },
];

interface Message {
  role: "user" | "ai";
  text: string;
  ts: number;
}

export default function FloatingAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [suggestTab, setSuggestTab] = useState<"preset" | "custom">("preset");
  const [customSuggestions, setCustomSuggestions] = useState<string[]>([]);
  const [newCustom, setNewCustom] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load custom prompts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_KEY);
      if (saved) setCustomSuggestions(JSON.parse(saved));
    } catch {}
  }, []);

  const saveCustom = (list: string[]) => {
    setCustomSuggestions(list);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
  };

  const addCustom = () => {
    const v = newCustom.trim();
    if (!v || customSuggestions.includes(v)) return;
    saveCustom([...customSuggestions, v]);
    setNewCustom("");
  };

  const deleteCustom = (item: string) => saveCustom(customSuggestions.filter(c => c !== item));

  // Stop pulsing after first open
  const handleOpen = () => {
    setOpen(true);
    setPulse(false);
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Listen for external open trigger (e.g. from Sidebar)
  useEffect(() => {
    const handler = () => { setOpen(true); setPulse(false); setTimeout(() => inputRef.current?.focus(), 300); };
    window.addEventListener("openAIChat", handler);
    return () => window.removeEventListener("openAIChat", handler);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", text: trimmed, ts: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/coach/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      const reply = data.answer || data.reply || data.message || "I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role: "ai", text: reply, ts: Date.now() }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Couldn't reach the coach right now. Try again later.", ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop for mobile / click-outside */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="fixed bottom-24 right-5 z-50 w-85 md:w-95 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{
                background: "linear-gradient(145deg, #111 0%, #1a1a1a 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                maxHeight: "70vh",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px color-mix(in srgb, var(--accent) 12%, transparent)",
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3.5 shrink-0"
                style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent) 5%, transparent))", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, var(--accent) 22%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a7 7 0 0 1 7 7c0 4-3 5.5-3 8H8c0-2.5-3-4-3-8a7 7 0 0 1 7-7z"/>
                    <path d="M9 21h6M10 17h4"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">MoniqoFi AI</div>
                  <div className="text-[10px]" style={{ color: "color-mix(in srgb, var(--accent) 80%, white)" }}>Ask anything about your finances</div>
                </div>
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} title="Clear chat"
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-orange-400 hover:bg-orange-400/10 transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                )}
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm" style={{ scrollbarWidth: "none" }}>
                {messages.length === 0 && !loading && (
                  <div className="py-1">
                    {/* Greeting bubble */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a7 7 0 0 1 7 7c0 4-3 5.5-3 8H8c0-2.5-3-4-3-8a7 7 0 0 1 7-7z"/><path d="M9 21h6M10 17h4"/>
                        </svg>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm px-3 py-2.5 text-gray-300 leading-relaxed"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", fontSize: "12.5px" }}>
                        Hi! I'm your MoniqoFi AI coach. Ask me anything about your finances — budgets, spending habits, savings goals, or tips to improve. 💡
                      </div>
                    </div>

                    {/* Tabs: Preset / My Questions */}
                    <div className="flex items-center gap-1 mb-3 p-0.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {(["preset", "custom"] as const).map(tab => (
                        <button key={tab} onClick={() => setSuggestTab(tab)}
                          className="flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
                          style={suggestTab === tab
                            ? { background: "color-mix(in srgb, var(--accent) 85%, black)", color: "white", boxShadow: `0 0 10px color-mix(in srgb, var(--accent) 30%, transparent)` }
                            : { color: "#555" }}>
                          {tab === "preset" ? "✦ Preset" : "★ My Questions"}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {suggestTab === "preset" ? (
                        <motion.div key="preset" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="space-y-3">
                          {PRESET_CATEGORIES.map(cat => (
                            <div key={cat.label}>
                              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-1.5 px-0.5">{cat.label}</div>
                              <div className="flex flex-wrap gap-1.5">
                                {cat.items.map(s => (
                                  <button key={s} onClick={() => send(s)}
                                    className="text-[11px] px-2.5 py-1 rounded-full transition-all hover:scale-105 active:scale-95"
                                    style={{
                                      background: "color-mix(in srgb, var(--accent) 9%, transparent)",
                                      border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
                                      color: "color-mix(in srgb, var(--accent) 80%, white)"
                                    }}>
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div key="custom" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="space-y-2">
                          {/* Add new */}
                          <form onSubmit={e => { e.preventDefault(); addCustom(); }} className="flex items-center gap-2 mb-2">
                            <input value={newCustom} onChange={e => setNewCustom(e.target.value)}
                              placeholder="Type your question to save…"
                              className="flex-1 bg-transparent text-white text-[12px] placeholder-gray-600 outline-none py-2 px-3 rounded-lg"
                              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }} />
                            <button type="submit" disabled={!newCustom.trim()}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0"
                              style={{ background: newCustom.trim() ? "var(--accent)" : "rgba(255,255,255,0.06)" }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            </button>
                          </form>
                          {customSuggestions.length === 0 ? (
                            <p className="text-[11px] text-gray-600 text-center py-4">No saved questions yet.<br/>Type and save your own above ↑</p>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {customSuggestions.map(s => (
                                <div key={s} className="flex items-center gap-2 group">
                                  <button onClick={() => send(s)} className="flex-1 text-left text-[11px] px-3 py-1.5 rounded-lg transition-all hover:scale-[1.01]"
                                    style={{ background: "color-mix(in srgb, var(--accent) 9%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", color: "color-mix(in srgb, var(--accent) 80%, white)" }}>
                                    {s}
                                  </button>
                                  <button onClick={() => deleteCustom(s)}
                                    className="w-6 h-6 rounded-md flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {messages.map((m) => (
                  <motion.div key={m.ts} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    {m.role === "ai" && (
                      <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                        style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a7 7 0 0 1 7 7c0 4-3 5.5-3 8H8c0-2.5-3-4-3-8a7 7 0 0 1 7-7z"/><path d="M9 21h6M10 17h4"/>
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[82%] rounded-2xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap`}
                      style={{
                        fontSize: "12.5px",
                        ...(m.role === "user"
                          ? { background: "color-mix(in srgb, var(--accent) 90%, black)", color: "white", borderRadius: "16px 16px 4px 16px" }
                          : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#d1d5db", borderRadius: "4px 16px 16px 16px" })
                      }}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center"
                      style={{ background: "color-mix(in srgb, var(--accent) 20%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 4-3 5.5-3 8H8c0-2.5-3-4-3-8a7 7 0 0 1 7-7z"/><path d="M9 21h6M10 17h4"/>
                      </svg>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "color-mix(in srgb, var(--accent) 70%, gray)" }}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Follow-up chips when there are messages */}
              {messages.length > 0 && !loading && (
                <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto shrink-0" style={{ scrollbarWidth: "none" }}>
                  {[...customSuggestions.slice(0, 2), ...PRESET_CATEGORIES[0].items.slice(0, 2)].slice(0, 4).map(s => (
                    <button key={s} onClick={() => send(s)} className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-full transition-all shrink-0 hover:scale-105"
                      style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)", color: "color-mix(in srgb, var(--accent) 75%, white)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 pb-3 pt-2 shrink-0"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your finances…"
                  disabled={loading}
                  className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 outline-none py-2 px-1"
                />
                {/* Save as custom shortcut */}
                {input.trim() && !loading && (
                  <button type="button" title="Save as quick question"
                    onClick={() => { const v = input.trim(); if (v && !customSuggestions.includes(v)) saveCustom([...customSuggestions, v]); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 text-gray-600 hover:text-yellow-400 hover:bg-yellow-400/10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </button>
                )}
                <button type="submit" disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0"
                  style={{
                    background: input.trim() && !loading ? "var(--accent)" : "rgba(255,255,255,0.06)",
                    boxShadow: input.trim() && !loading ? `0 0 16px color-mix(in srgb, var(--accent) 40%, transparent)` : "none",
                    transform: input.trim() && !loading ? "scale(1)" : "scale(0.95)",
                  }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        onClick={open ? () => setOpen(false) : handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          background: open
            ? "rgba(30,30,30,0.95)"
            : "var(--accent)",
          border: open ? "1px solid rgba(255,255,255,0.1)" : "none",
          boxShadow: open
            ? "0 8px 32px rgba(0,0,0,0.5)"
            : `0 8px 32px color-mix(in srgb, var(--accent) 50%, transparent), 0 0 0 ${pulse ? "8px" : "0px"} color-mix(in srgb, var(--accent) 20%, transparent)`,
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      >
        {/* Pulse ring */}
        {pulse && !open && (
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{ border: "2px solid color-mix(in srgb, var(--accent) 40%, transparent)" }}
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.8, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        )}
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </motion.svg>
          ) : (
            <motion.svg key="brain" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}
              width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 4-3 5.5-3 8H8c0-2.5-3-4-3-8a7 7 0 0 1 7-7z"/>
              <path d="M9 21h6M10 17h4"/>
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
