"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, JSX.Element> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", icon: "#10B981", bar: "#10B981" },
  error:   { bg: "rgba(229,9,20,0.12)",   border: "rgba(229,9,20,0.35)",   icon: "#E50914", bar: "#E50914" },
  warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", icon: "#F59E0B", bar: "#F59E0B" },
  info:    { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", icon: "#6366F1", bar: "#6366F1" },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const c = COLORS[toast.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.85 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="relative overflow-hidden rounded-2xl shadow-2xl flex items-start gap-3 p-4 cursor-pointer w-80 select-none"
      style={{ background: "rgba(12,12,12,0.96)", border: `1px solid ${c.border}`, backdropFilter: "blur(20px)" }}
      onClick={() => onRemove(toast.id)}
    >
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: c.bg }} />
      {/* Icon badge */}
      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5 relative z-10" style={{ background: `${c.icon}22`, color: c.icon, border: `1px solid ${c.icon}35` }}>
        {ICONS[toast.type]}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0 relative z-10">
        {toast.title && <div className="text-sm font-bold text-white mb-0.5">{toast.title}</div>}
        <div className="text-sm text-gray-400 leading-snug">{toast.message}</div>
      </div>
      {/* Close */}
      <button className="shrink-0 text-gray-600 hover:text-white transition-colors relative z-10 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      {/* Auto-dismiss progress bar */}
      <motion.div className="absolute bottom-0 left-0 h-0.5 rounded-full" style={{ background: c.bar }}
        initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 4.5, ease: "linear" }} />
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev.slice(-4), { id, message, type, title }]);
    setTimeout(() => remove(id), 4800);
  }, [remove]);

  const value: ToastContextValue = {
    toast: add,
    success: (m, t) => add(m, "success", t),
    error:   (m, t) => add(m, "error",   t),
    warning: (m, t) => add(m, "warning", t),
    info:    (m, t) => add(m, "info",    t),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
