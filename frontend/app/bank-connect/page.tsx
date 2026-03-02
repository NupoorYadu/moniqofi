'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

// ── Types ──────────────────────────────────────────────────────────────────────
type Stage = 'form' | 'waiting' | 'ready' | 'fetching' | 'done' | 'error';

interface LinkedBank {
  consent_id: string;
  status: string;
  vua: string;
  created_at: string;
}

// ── Bank grid ──────────────────────────────────────────────────────────────────
const BANKS = [
  { name: 'SBI', color: '#1565c0', abbr: 'SBI' },
  { name: 'HDFC Bank', color: '#004c8c', abbr: 'HDFC' },
  { name: 'ICICI Bank', color: '#e05c00', abbr: 'ICIC' },
  { name: 'Axis Bank', color: '#97144d', abbr: 'AXIS' },
  { name: 'Kotak', color: '#c8202f', abbr: 'KMB' },
  { name: 'Yes Bank', color: '#0033a0', abbr: 'YES' },
  { name: 'PNB', color: '#006633', abbr: 'PNB' },
  { name: 'Bank of Baroda', color: '#f47920', abbr: 'BOB' },
  { name: 'Canara Bank', color: '#003366', abbr: 'CNB' },
  { name: '+ All Banks', color: '#555', abbr: '…' },
];

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ── Component ──────────────────────────────────────────────────────────────────
export default function BankConnectPage() {
  const [stage, setStage] = useState<Stage>('form');
  const [mobile, setMobile] = useState('');
  const [consentId, setConsentId] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');
  const [result, setResult] = useState<{ saved: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>([]);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // ── Load existing consents ────────────────────────────────────────────────────
  const loadLinkedBanks = useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/aa/banks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setLinkedBanks(await r.json());
    } catch {}
  }, [token]);

  useEffect(() => {
    loadLinkedBanks();
  }, [loadLinkedBanks]);

  // ── Poll consent status ───────────────────────────────────────────────────────
  const startPolling = useCallback((cid: string) => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`${API}/api/aa/consent/${cid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          if (data.status === 'ACTIVE') {
            clearInterval(iv);
            setStage('ready');
            loadLinkedBanks();
          } else if (['REJECTED', 'REVOKED', 'EXPIRED'].includes(data.status)) {
            clearInterval(iv);
            setErrorMsg(`Consent ${data.status.toLowerCase()}. Please try again.`);
            setStage('error');
          }
        }
      } catch {}
    }, 3000);
    setPollInterval(iv);
    return () => clearInterval(iv);
  }, [token, loadLinkedBanks]);

  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreateConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobile.trim()) return;
    try {
      const r = await fetch(`${API}/api/aa/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mobile: mobile.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Failed to create consent');
      setConsentId(data.consentId);
      setRedirectUrl(data.redirectUrl);
      setStage('waiting');
      startPolling(data.consentId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unexpected error');
      setStage('error');
    }
  };

  const handleOpenConsentFlow = () => {
    window.open(redirectUrl, '_blank', 'width=480,height=720');
  };

  const handleFetchData = async (cid: string) => {
    setStage('fetching');
    try {
      const r = await fetch(`${API}/api/aa/fetch/${cid}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Fetch failed');
      setResult({ saved: data.saved, total: data.total });
      setStage('done');
      loadLinkedBanks();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Fetch failed');
      setStage('error');
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-emerald-500/20 text-emerald-400',
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      REJECTED: 'bg-red-500/20 text-red-400',
      REVOKED: 'bg-gray-500/20 text-gray-400',
      EXPIRED: 'bg-orange-500/20 text-orange-400',
    };
    return map[s] || 'bg-gray-500/20 text-gray-400';
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold text-white mb-1">Connect Your Bank</h1>
            <p className="text-gray-400 mb-8 text-sm">
              Powered by&nbsp;
              <span className="text-purple-400 font-semibold">Setu Account Aggregator</span>
              &nbsp;— RBI-regulated, read-only bank access.
            </p>
          </motion.div>

          {/* Supported banks */}
          <motion.div
            className="grid grid-cols-5 gap-2 mb-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          >
            {BANKS.map(b => (
              <div
                key={b.name}
                className="flex flex-col items-center justify-center rounded-xl p-3 bg-white/5 border border-white/10 hover:border-white/20 transition"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-[10px] font-bold mb-1"
                  style={{ backgroundColor: b.color }}
                >
                  {b.abbr}
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{b.name}</span>
              </div>
            ))}
          </motion.div>

          {/* Main card */}
          <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          >
            <AnimatePresence mode="wait">

              {/* ── STAGE: form ── */}
              {stage === 'form' && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 className="text-xl font-semibold text-white mb-2">Enter your mobile number</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    We&apos;ll send a consent request to your bank via your registered mobile number.
                    Your credentials are never shared with MoniqoFi.
                  </p>
                  <form onSubmit={handleCreateConsent} className="space-y-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="9999999999"
                        value={mobile}
                        onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl pl-14 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={mobile.length !== 10}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition"
                    >
                      Request Bank Access
                    </button>
                  </form>
                  <p className="text-xs text-gray-500 mt-4 text-center">
                    🔒 &nbsp;Read-only access · No login credentials shared · RBI AA regulated
                  </p>
                </motion.div>
              )}

              {/* ── STAGE: waiting ── */}
              {stage === 'waiting' && (
                <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                  <h2 className="text-xl font-semibold text-white mb-2">Waiting for your approval</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    A consent screen has been prepared. Open it, verify your OTP, and approve the data request.
                  </p>
                  <button
                    onClick={handleOpenConsentFlow}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    Open Bank Consent Screen ↗
                  </button>
                  <p className="text-xs text-gray-500 mt-4">Auto-detecting approval…</p>
                </motion.div>
              )}

              {/* ── STAGE: ready ── */}
              {stage === 'ready' && (
                <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                  <div className="text-5xl mb-4">✅</div>
                  <h2 className="text-xl font-semibold text-white mb-2">Consent Approved!</h2>
                  <p className="text-gray-400 text-sm mb-6">Your bank is ready to share data. Click below to import your transactions.</p>
                  <button
                    onClick={() => handleFetchData(consentId)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-8 py-3 rounded-xl transition"
                  >
                    Import Transactions
                  </button>
                </motion.div>
              )}

              {/* ── STAGE: fetching ── */}
              {stage === 'fetching' && (
                <motion.div key="fetching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                  <h2 className="text-xl font-semibold text-white mb-2">Fetching Transactions…</h2>
                  <p className="text-gray-400 text-sm">Pulling up to 6 months of data from your bank. This may take ~20 seconds.</p>
                </motion.div>
              )}

              {/* ── STAGE: done ── */}
              {stage === 'done' && result && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bank Connected!</h2>
                  <p className="text-gray-300 mb-1">
                    <span className="text-emerald-400 font-semibold text-3xl">{result.saved}</span>
                    &nbsp;transactions imported
                  </p>
                  <p className="text-gray-500 text-sm mb-6">({result.total} parsed, {result.total - result.saved} skipped)</p>
                  <div className="flex gap-3 justify-center">
                    <a href="/dashboard" className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl transition">
                      View Dashboard
                    </a>
                    <button
                      onClick={() => { setStage('form'); setMobile(''); setConsentId(''); }}
                      className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-2.5 rounded-xl transition"
                    >
                      Connect Another Bank
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STAGE: error ── */}
              {stage === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-4">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
                  <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
                  <button
                    onClick={() => { setStage('form'); setErrorMsg(''); }}
                    className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* ── Linked Banks ──────────────────────────────────────────────────── */}
          {linkedBanks.length > 0 && (
            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            >
              <h2 className="text-lg font-semibold text-white mb-4">Your Linked Banks</h2>
              <div className="space-y-3">
                {linkedBanks.map(b => (
                  <div
                    key={b.consent_id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-5 py-4"
                  >
                    <div>
                      <p className="text-white font-medium">{b.vua}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Connected {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(b.status)}`}>
                        {b.status}
                      </span>
                      {b.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleFetchData(b.consent_id)}
                          className="text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 px-3 py-1.5 rounded-lg transition"
                        >
                          Sync Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── How it works ─────────────────────────────────────────────────── */}
          <motion.div
            className="mt-10 grid grid-cols-3 gap-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          >
            {[
              { step: '1', title: 'You approve', desc: "A one-time consent screen appears from your bank's trusted AA portal." },
              { step: '2', title: 'Read-only fetch', desc: 'MoniqoFi receives only your past transactions — never your password.' },
              { step: '3', title: 'Auto-categorised', desc: 'Transactions are instantly categorised and added to your dashboard.' },
            ].map(s => (
              <div key={s.step} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="w-8 h-8 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center font-bold text-sm mb-3">
                  {s.step}
                </div>
                <p className="text-white font-semibold text-sm mb-1">{s.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </motion.div>

        </div>
      </main>
    </div>
  );
}
