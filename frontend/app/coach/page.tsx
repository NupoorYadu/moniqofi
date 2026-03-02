"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCard, { GlowingOrb } from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { CoachHero } from "../components/PageVisuals";

interface Message {
  role: "user" | "coach";
  text: string;
  tips?: string[];
  context?: any;
  mode?: "groq" | "rules";
}

const quickQuestions = [
  "How am I doing financially?",
  "Where am I overspending?",
  "Can I afford a phone worth ₹30000?",
  "What should my budget plan look like?",
  "Am I on track for my goals?",
  "Give me a savings challenge",
];

export default function CoachPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    setMessages([
      {
        role: "coach",
        text: "Hey! I'm your **AI Financial Coach**. I can see your real transaction data, budgets, and goals — so ask me *anything* about your money!",
      },
    ]);
  }, [router, API]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askCoach = async (question: string) => {
    const token = localStorage.getItem("token");
    if (!token || !question.trim()) return;

    const userMsg: Message = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.role === "user" || (m.role === "coach" && !m.text.includes("AI Financial Coach")))
        .slice(-10)
        .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));

      const res = await fetch(`${API}/api/coach/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, history }),
      });
      const data = await res.json();

      const coachMsg: Message = {
        role: "coach",
        text: data.answer || data.message || "I couldn't process that. Try again.",
        tips: data.tips,
        context: data.context,
        mode: data.mode,
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "coach", text: "Sorry, something went wrong. Please try again." },
      ]);
    }
    setLoading(false);
  };

  // Markdown renderer for coach responses
  const renderMarkdown = (text: string) => {
    const parts = text.split("\n");
    return parts.map((line, i) => {
      let html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

      // Bullet points
      if (html.startsWith("- ") || html.startsWith("* ")) {
        html = `<span class="inline-block ml-2">${html.slice(2)}</span>`;
        return (
          <div key={i} className="flex items-start gap-1.5 py-0.5">
            <span className="text-[#E50914] mt-0.5 shrink-0">•</span>
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      }
      // Table rows
      if (html.startsWith("|")) {
        if (html.match(/^\|[\s-|]+$/)) return null;
        const cells = html.split("|").filter((c) => c.trim());
        return (
          <div key={i} className="flex gap-4 py-0.5 text-sm">
            {cells.map((cell, j) => (
              <span key={j} className={j === 0 ? "font-medium w-40" : ""}
                dangerouslySetInnerHTML={{ __html: cell.trim() }} />
            ))}
          </div>
        );
      }
      // Empty line = paragraph break
      if (html.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="py-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  };

  const modeBadge = (mode?: string) => {
    if (mode === "groq") {
      return (
        <span className="text-[10px] bg-[#E50914]/30 text-red-100 px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
          Groq AI
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-gray-700/50 text-gray-200 px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
        Smart Engine
      </span>
    );
  };

  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen flex flex-col bg-[#0A0A0A] relative overflow-hidden">
        <GlowingOrb color="#6366F1" size={300} top="-5%" right="-5%" delay={0} />
        <GlowingOrb color="#E50914" size={200} bottom="5%" left="-3%" delay={2} />
        {/* Header */}
        <div className="relative z-10 m-6 mb-0">
          <CoachHero />
        </div>

        {/* Chat Area */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-coach"}>
                {msg.role === "coach" && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center text-white text-xs font-bold">M</span>
                    <span className="text-sm font-semibold text-white">
                      MoniqoFi Coach
                    </span>
                    {modeBadge(msg.mode)}
                  </div>
                )}
                <div className={msg.role === "user" ? "text-white" : "text-white text-sm leading-relaxed"}>
                  {msg.role === "coach" ? renderMarkdown(msg.text) : msg.text}
                </div>
                {msg.context && msg.context.balance !== undefined && (
                  <div className="mt-3 pt-2 border-t border-gray-700 flex gap-3 text-xs text-gray-400">
                    <span>Balance: ₹{msg.context.balance?.toLocaleString()}</span>
                    <span>Savings: {msg.context.savingsRate}%</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="chat-bubble-coach">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#E50914] flex items-center justify-center text-white text-xs font-bold">M</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="relative z-10 px-6 pb-2">
          <div className="flex gap-2 flex-wrap">
            {quickQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(229,9,20,0.15)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => askCoach(q)}
                disabled={loading}
                className="text-xs dark-card px-3 py-1.5 rounded-xl text-gray-400 hover:text-white transition disabled:opacity-50 border border-white/[0.06]"
              >
                {q}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="relative z-10 p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dark-card p-4 rounded-2xl border border-white/[0.06]">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && askCoach(input)}
                placeholder="Ask about your finances..."
                className="flex-1 dark-input rounded-xl p-3 text-white"
                disabled={loading}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => askCoach(input)}
                disabled={loading || !input.trim()}
                className="netflix-btn rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </motion.button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
