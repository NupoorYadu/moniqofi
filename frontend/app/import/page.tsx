"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "../lib/api";

const API = API_BASE;

const CATEGORIES = ["Food","Transport","Shopping","Bills","Health","Entertainment","Education","EMI","Transfer","Investment","Insurance","Income","Other"];
const BANKS = [
  { name: "SBI",          logo: "🏦", hint: "Internet Banking → Accounts → Account Statement → Download PDF or CSV" },
  { name: "HDFC Bank",    logo: "🔵", hint: "NetBanking → Accounts → Account Statement → Download PDF or CSV" },
  { name: "ICICI Bank",   logo: "🟠", hint: "iMobile / NetBanking → Account Statement → Export PDF or CSV" },
  { name: "Axis Bank",    logo: "🟣", hint: "Internet Banking → Account Summary → View Statement → Download PDF or CSV" },
  { name: "Kotak Bank",   logo: "🔴", hint: "Net Banking → Accounts → Account Statement → Download PDF or CSV" },
  { name: "IndusInd",     logo: "🟢", hint: "IndusMobile → Accounts → Statement → Download PDF or CSV" },
  { name: "Yes Bank",     logo: "⚫", hint: "YES Online → Accounts → Statement View → Download PDF or CSV" },
  { name: "PNB",          logo: "🏛️", hint: "PNB Online → My Account → View/Download Statement → PDF or CSV" },
];

interface ParsedRow {
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string | null;
  selected: boolean;
}

type Stage = "upload" | "preview" | "done";

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage]         = useState<Stage>("upload");
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [detectedBank, setDetectedBank] = useState("");
  const [rows, setRows]           = useState<ParsedRow[]>([]);
  const [savedCount, setSavedCount]     = useState(0);

  const token  = () => typeof window !== "undefined" ? localStorage.getItem("token") : "";

  // ── Upload CSV to /api/transactions/import/preview ──
  const uploadFile = useCallback(async (file: File) => {
    setError("");

    const tk = token();
    if (!tk) { router.push("/login"); return; }

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API}/api/transactions/import/preview`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tk}` },
        body: form,
      });

      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }

      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) { setError((data.message as string) || `Upload failed (${res.status})`); return; }

      setDetectedBank((data.bank as string) || "");
      setRows((data.transactions as Omit<ParsedRow, "selected">[]).map((t) => ({ ...t, selected: true })));
      setStage("preview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Could not reach server: ${msg}`);
    } finally {
      setUploading(false);
    }
  }, [router]);

  // ── Drop handler ──
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // ── File picker handler ──
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  // ── Edit a row field ──
  const editRow = (idx: number, field: keyof ParsedRow, value: string | boolean) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  // ── Toggle all ──
  const allSelected = rows.every((r) => r.selected);
  const toggleAll   = () => setRows((prev) => prev.map((r) => ({ ...r, selected: !allSelected })));

  const selectedRows = rows.filter((r) => r.selected);

  // ── Confirm import ──
  const confirmImport = async () => {
    if (selectedRows.length === 0) return;
    const tk = token();
    if (!tk) { router.push("/login"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/transactions/import/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: selectedRows }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* non-JSON */ }
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) { setError((data.message as string) || "Import failed"); return; }
      setSavedCount((data.inserted as number) ?? (data.saved as number) ?? 0);
      setStage("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Could not reach server: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-black tracking-tight">
              Import <span className="text-[#E50914]">Bank Statement</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Upload your bank statement (PDF or CSV) — transactions are auto-detected and categorised
            </p>
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-4 px-4 py-3 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914] text-sm font-medium">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────────────────── STAGE: UPLOAD ─────────────────────── */}
          {stage === "upload" && (
            <div className="space-y-6">
              {/* Drop zone */}
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className="cursor-pointer border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-4 transition-all"
                style={{ borderColor: dragging ? "#E50914" : "rgba(255,255,255,0.1)", background: dragging ? "rgba(229,9,20,0.04)" : "rgba(255,255,255,0.01)" }}>
                <input ref={fileRef} type="file" accept=".csv,.pdf,.xlsx,.xls,.ods,.txt,text/csv,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={onFileChange} />
                {uploading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                      className="w-12 h-12 rounded-full border-2 border-[#E50914] border-t-transparent" />
                    <p className="text-gray-400">Parsing your statement...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-[#E50914]/10 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-white">Drop your bank statement here</p>
                      <p className="text-gray-500 text-sm mt-1">or click to browse · any format works</p>
                    </div>
                    <span className="text-xs text-gray-600 px-3 py-1 rounded-full border border-white/10">
                      PDF · CSV · Excel (.xlsx) · TXT · up to 20 MB
                    </span>
                  </>
                )}
              </motion.div>

              {/* Supported banks */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Supported Banks — How to Download</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BANKS.map((b) => (
                    <div key={b.name} className="flex items-start gap-3 p-4 rounded-xl border border-white/6 bg-white/2">
                      <span className="text-2xl shrink-0">{b.logo}</span>
                      <div>
                        <p className="font-semibold text-sm text-white">{b.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{b.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="p-5 rounded-2xl border border-white/6 bg-white/2">
                <h3 className="font-bold text-sm mb-3 text-gray-300">Tips for a clean import</h3>
                <ul className="space-y-2 text-xs text-gray-500">
                  <li className="flex items-center gap-2"><span className="text-[#10B981]">✓</span> Export the <strong className="text-gray-400">last 3–12 months</strong> for rich insights</li>
                  <li className="flex items-center gap-2"><span className="text-[#10B981]">✓</span> Both <strong className="text-gray-400">PDF and CSV</strong> are supported — Excel (XLS) is not</li>
                  <li className="flex items-center gap-2"><span className="text-[#10B981]">✓</span> Include <strong className="text-gray-400">all columns</strong> (Date, Description, Debit, Credit, Balance)</li>
                  <li className="flex items-center gap-2"><span className="text-[#F59E0B]">✓</span> Categories are <strong className="text-gray-400">auto-detected</strong> — you can edit them before confirming</li>
                </ul>
              </div>
            </div>
          )}

          {/* ────────────────────── STAGE: PREVIEW ────────────────────── */}
          {stage === "preview" && (
            <div className="space-y-5">
              {/* Summary bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{BANKS.find((b) => b.name === detectedBank)?.logo ?? "🏦"}</span>
                  <div>
                    <p className="font-bold text-white">{detectedBank} detected</p>
                    <p className="text-xs text-gray-500">{rows.length} transactions parsed · {selectedRows.length} selected</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setStage("upload"); setRows([]); setError(""); }}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 transition">
                    ← Upload different file
                  </button>
                  <button onClick={confirmImport} disabled={saving || selectedRows.length === 0}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-[#E50914] hover:bg-[#B20710] text-white transition disabled:opacity-40">
                    {saving ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                    {saving ? "Saving..." : `Import ${selectedRows.length} transactions`}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl overflow-hidden border border-white/6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/6 bg-white/2">
                        <th className="px-3 py-3 text-left">
                          <input type="checkbox" checked={allSelected} onChange={toggleAll}
                            className="rounded border-white/20 bg-white/5 cursor-pointer" />
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-400">Date</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-400">Description</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-400">Amount</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-400">Type</th>
                        <th className="px-3 py-3 text-left font-medium text-gray-400">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={i}
                          className={`border-b border-white/4 transition ${row.selected ? "" : "opacity-40"}`}>
                          <td className="px-3 py-2.5">
                            <input type="checkbox" checked={row.selected} onChange={(e) => editRow(i, "selected", e.target.checked)}
                              className="rounded border-white/20 bg-white/5 cursor-pointer" />
                          </td>
                          <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">
                            {row.date ? new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <input value={row.title} onChange={(e) => editRow(i, "title", e.target.value)}
                              className="w-full bg-transparent text-white text-sm outline-none focus:bg-white/5 rounded px-1 py-0.5 transition min-w-40" />
                          </td>
                          <td className="px-3 py-2.5 font-semibold whitespace-nowrap"
                            style={{ color: row.type === "income" ? "#10B981" : "#E50914" }}>
                            ₹{Number(row.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5">
                            <select value={row.type} onChange={(e) => editRow(i, "type", e.target.value as "income" | "expense")}
                              className="bg-transparent text-xs border border-white/10 rounded px-2 py-1 text-gray-300 cursor-pointer">
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <select value={row.category} onChange={(e) => editRow(i, "category", e.target.value)}
                              className="bg-transparent text-xs border border-white/10 rounded px-2 py-1 text-gray-300 cursor-pointer">
                              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────── STAGE: DONE ─────────────────────── */}
          {stage === "done" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-12 text-center border border-white/6 bg-white/2">
              <motion.div className="text-6xl mb-4" animate={{ scale: [0.5, 1.2, 1] }} transition={{ duration: 0.6 }}>🎉</motion.div>
              <h2 className="text-2xl font-black text-white mb-2">Import Complete!</h2>
              <p className="text-gray-400 mb-6">
                <span className="text-[#10B981] font-bold text-xl">{savedCount}</span> transactions imported and categorized.
                <br />Your dashboard, budgets, and health score are now updated.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => router.push("/dashboard")}
                  className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#B20710] text-white font-semibold transition">
                  View Dashboard
                </button>
                <button onClick={() => { setStage("upload"); setRows([]); setError(""); setSavedCount(0); }}
                  className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 font-medium transition">
                  Import Another File
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
