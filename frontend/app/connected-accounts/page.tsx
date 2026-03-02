"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Sidebar from "../components/Sidebar";
import AnimatedCard, {
  StaggerContainer,
  StaggerItem,
} from "../components/AnimatedCard";
import AnimatedBackground from "../components/AnimatedBackground";
import { motion, AnimatePresence } from "framer-motion";

/* ── Lazy-load Plaid Link so the page works even if the package has issues ── */
const LazyPlaidLink = dynamic(
  () =>
    import("react-plaid-link").then((mod) => {
      const Btn = ({
        linkToken,
        onSuccess,
      }: {
        linkToken: string;
        onSuccess: (t: string, m: any) => void;
      }) => {
        const { open, ready } = mod.usePlaidLink({
          token: linkToken,
          onSuccess: (pub, meta) => onSuccess(pub, meta),
        });
        return (
          <button
            onClick={() => open()}
            disabled={!ready}
            className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#B20710] text-white font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            {ready ? "Connect Bank or Payment App" : "Initializing..."}
          </button>
        );
      };
      return { default: Btn };
    }),
  {
    ssr: false,
    loading: () => (
      <button disabled className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#E50914]/50 text-white/60 font-semibold cursor-wait">
        Loading Plaid...
      </button>
    ),
  }
);

interface LinkedAccount {
  id: number;
  institution_name: string;
  account_name: string | null;
  account_mask: string | null;
  account_type: string | null;
  status: string;
  last_synced: string | null;
  created_at: string;
}

type ConnectionStatus = "checking" | "backend-down" | "plaid-not-configured" | "ready";

export default function ConnectedAccountsPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [unlinkingId, setUnlinkingId] = useState<number | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [balances, setBalances] = useState<Record<number, { available: number | null; current: number | null; currency: string | null }>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const headers = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  /* ── Check backend + Plaid status ── */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    let cancelled = false;

    (async () => {
      // Step 1: Check if backend is reachable
      try {
        const ping = await fetch(`${API}/`, { signal: AbortSignal.timeout(5000) });
        if (!ping.ok) throw new Error();
      } catch {
        if (!cancelled) { setStatus("backend-down"); setLoading(false); }
        return;
      }

      // Step 2: Try to fetch accounts
      try {
        const acctRes = await fetch(`${API}/api/plaid/accounts`, { headers: headers() });
        const acctData = await acctRes.json();
        if (!cancelled) setAccounts(Array.isArray(acctData) ? acctData : []);
      } catch {
        if (!cancelled) setAccounts([]);
      }

      // Step 3: Try to get Plaid link token
      try {
        const linkRes = await fetch(`${API}/api/plaid/create-link-token`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({}),
        });
        const linkData = await linkRes.json();

        if (!cancelled) {
          if (linkData.link_token) {
            setLinkToken(linkData.link_token);
            setStatus("ready");
          } else {
            setStatus("plaid-not-configured");
          }
        }
      } catch {
        if (!cancelled) setStatus("plaid-not-configured");
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [API, router, headers]);

  /* ── After Plaid Link success ── */
  const handlePlaidSuccess = async (publicToken: string, metadata: any) => {
    try {
      const res = await fetch(`${API}/api/plaid/exchange-token`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ public_token: publicToken, metadata }),
      });
      const data = await res.json();
      if (res.ok) {
        const acctRes = await fetch(`${API}/api/plaid/accounts`, { headers: headers() });
        const acctData = await acctRes.json();
        setAccounts(Array.isArray(acctData) ? acctData : []);
        fetchBalances();
        setSyncMsg("Bank connected! Transactions syncing in background...");
        setTimeout(() => setSyncMsg(""), 5000);
      } else {
        setSyncMsg(data.message || "Connection failed");
      }
    } catch {
      setSyncMsg("Connection error");
    }
  };

  /* ── Manual sync ── */
  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch(`${API}/api/plaid/sync`, {
        method: "POST",
        headers: headers(),
      });
      const data = await res.json();
      setSyncMsg(data.message || `Synced ${data.synced} transactions`);
      const acctRes = await fetch(`${API}/api/plaid/accounts`, { headers: headers() });
      const acctData = await acctRes.json();
      setAccounts(Array.isArray(acctData) ? acctData : []);
      fetchBalances();
    } catch {
      setSyncMsg("Sync failed — is the backend running?");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 6000);
    }
  };

  /* ── Unlink ── */
  const handleUnlink = async (id: number) => {
    setUnlinkingId(id);
    try {
      await fetch(`${API}/api/plaid/accounts/${id}`, { method: "DELETE", headers: headers() });
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setSyncMsg("Failed to unlink");
    } finally {
      setUnlinkingId(null);
    }
  };

  /* ── Retry connection ── */
  const handleRetry = () => {
    setLoading(true);
    setStatus("checking");
    setAccounts([]);
    setLinkToken(null);
    window.location.reload();
  };

  /* ── Fetch live balances from Plaid ── */
  const fetchBalances = async () => {
    setLoadingBalances(true);
    try {
      const res = await fetch(`${API}/api/plaid/balances`, { headers: headers() });
      if (!res.ok) return;
      const data: Array<{
        linked_account_id: number;
        balance_available: number | null;
        balance_current:   number | null;
        currency:          string | null;
      }> = await res.json();
      const map: Record<number, { available: number | null; current: number | null; currency: string | null }> = {};
      for (const b of data) {
        map[b.linked_account_id] = {
          available: b.balance_available,
          current:   b.balance_current,
          currency:  b.currency,
        };
      }
      setBalances(map);
    } catch { /* silently fail */ }
    finally { setLoadingBalances(false); }
  };

  const activeAccounts = accounts.filter((a) => a.status === "active");

  const accountIcon = (type: string | null) => {
    const props = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (type) {
      case "depository":
        return <svg {...props} stroke="#10B981"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/></svg>;
      case "credit":
        return <svg {...props} stroke="#FBBF24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><path d="M6 16h4"/></svg>;
      default:
        return <svg {...props} stroke="#8B5CF6"><circle cx="12" cy="12" r="10"/><path d="M12 6v12m-4-4h8"/></svg>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <Sidebar />
      <main className="flex-1 ml-64 p-4 lg:p-8 relative overflow-hidden">
        <AnimatedBackground />

        <div className="relative z-10 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Connected <span className="text-[#E50914]">Accounts</span>
              </h1>
              <p className="text-gray-400 mt-1">
                Link your bank accounts & payment apps to auto-import transactions
              </p>
            </div>

            <div className="flex gap-3">
              {activeAccounts.length > 0 && (
                <button onClick={fetchBalances} disabled={loadingBalances}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-40">
                  <motion.div
                    animate={loadingBalances ? { rotate: 360 } : {}}
                    transition={loadingBalances ? { repeat: Infinity, duration: 1.2, ease: "linear" } : {}}
                    className="w-3 h-3 rounded-full border-2 bg-transparent"
                    style={{ borderColor: "#10B981", borderTopColor: "transparent" }}
                  />
                  {loadingBalances ? "Updating..." : "Live Balance"}
                </button>
              )}
              {activeAccounts.length > 0 && (
                <button onClick={handleSync} disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium transition-all disabled:opacity-40">
                  <motion.svg animate={syncing ? { rotate: 360 } : {}} transition={syncing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </motion.svg>
                  {syncing ? "Syncing..." : "Sync Now"}
                </button>
              )}
            </div>
          </motion.div>

          {/* Status message */}
          <AnimatePresence>
            {syncMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`px-4 py-3 rounded-xl text-sm font-medium ${
                  syncMsg.includes("fail") || syncMsg.includes("error")
                    ? "bg-[#E50914]/10 border border-[#E50914]/20 text-[#E50914]"
                    : "bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981]"
                }`}>
                {syncMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ──────────────── STATUS: CHECKING ──────────────── */}
          {status === "checking" && (
            <AnimatedCard>
              <div className="p-10 flex flex-col items-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 border-3 border-[#E50914] border-t-transparent rounded-full" />
                <p className="text-gray-400">Checking connection status...</p>
              </div>
            </AnimatedCard>
          )}

          {/* ──────────────── STATUS: BACKEND DOWN ──────────────── */}
          {status === "backend-down" && (
            <AnimatedCard>
              <div className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#E50914]/10 flex items-center justify-center shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">Backend Server Not Running</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      The backend server at <code className="text-gray-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">{API || "http://localhost:5000"}</code> is not reachable.
                    </p>
                    <div className="mt-4 p-4 rounded-xl bg-white/3 border border-white/6">
                      <p className="text-gray-400 text-xs mb-2">Start the backend server:</p>
                      <code className="text-[#10B981] text-sm font-mono block">cd backend && npm run dev</code>
                    </div>
                    <button onClick={handleRetry}
                      className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B20710] text-white font-semibold text-sm transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          )}

          {/* ──────────────── STATUS: PLAID NOT CONFIGURED ──────────────── */}
          {status === "plaid-not-configured" && (
            <AnimatedCard>
              <div className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#FBBF24]/10 flex items-center justify-center shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">Plaid API Keys Required</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      To connect bank accounts and payment apps, Plaid API keys need to be configured in the backend.
                    </p>
                    <button onClick={handleRetry}
                      className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B20710] text-white font-semibold text-sm transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                      </svg>
                      Retry Connection
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedCard>
          )}

          {/* ──────────────── STATUS: READY ──────────────── */}
          {status === "ready" && (
            <>
              {/* Connect button */}
              <AnimatedCard>
                <div className="p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#E50914]/10 flex items-center justify-center shrink-0">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Link a Bank or Payment App</h3>
                      <p className="text-gray-400 text-sm">
                        Supports 12,000+ banks, UPI, credit cards, and wallets via Plaid
                      </p>
                    </div>
                  </div>

                  {linkToken && (
                    <LazyPlaidLink linkToken={linkToken} onSuccess={handlePlaidSuccess} />
                  )}
                </div>
              </AnimatedCard>

              {/* Linked accounts grid */}
              {activeAccounts.length === 0 ? (
                <AnimatedCard>
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-300">No accounts connected yet</h3>
                    <p className="text-gray-500 mt-1 text-sm max-w-sm mx-auto">
                      Click the button above to securely link your bank or payment app.
                    </p>
                  </div>
                </AnimatedCard>
              ) : (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAccounts.map((acct) => (
                    <StaggerItem key={acct.id}>
                      <AnimatedCard className="h-full">
                        <div className="p-5 flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                              {accountIcon(acct.account_type)}
                            </div>
                            <div>
                              <h4 className="font-bold text-base">{acct.institution_name}</h4>
                              <p className="text-sm text-gray-400">
                                {acct.account_name || acct.account_type || "Account"}
                                {acct.account_mask && <span className="text-gray-600 ml-1">****{acct.account_mask}</span>}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] text-xs font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                                  Connected
                                </span>
                                {acct.last_synced && (
                                  <span className="text-xs text-gray-600">Synced: {new Date(acct.last_synced).toLocaleDateString()}</span>
                                )}
                              </div>                            {/* Live balance row */}
                            {balances[acct.id] ? (
                              <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-white/6">
                                {balances[acct.id].current !== null && (
                                  <div>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-wider">Current</p>
                                    <p className="text-sm font-bold text-white">
                                      {balances[acct.id].currency === "USD" ? "$" : (balances[acct.id].currency ?? "")}
                                      {balances[acct.id].current!.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                )}
                                {balances[acct.id].available !== null && (
                                  <div>
                                    <p className="text-[9px] text-gray-600 uppercase tracking-wider">Available</p>
                                    <p className="text-sm font-semibold text-[#10B981]">
                                      {balances[acct.id].currency === "USD" ? "$" : (balances[acct.id].currency ?? "")}
                                      {balances[acct.id].available!.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-700 mt-2">Click “Live Balance” to refresh</p>
                            )}                            </div>
                          </div>
                          <button onClick={() => handleUnlink(acct.id)} disabled={unlinkingId === acct.id}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Disconnect">
                            {unlinkingId === acct.id ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
                                className="w-5 h-5 border-2 border-gray-600 border-t-red-400 rounded-full" />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      </AnimatedCard>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </>
          )}

          {/* How it works — always visible */}
          <AnimatedCard>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4">How It Works</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { step: "1", title: "Connect", desc: "Securely link your bank account, UPI, or credit card through Plaid", color: "#E50914" },
                  { step: "2", title: "Auto-Sync", desc: "Your transactions are pulled automatically — no manual entry needed", color: "#10B981" },
                  { step: "3", title: "Insights", desc: "All your spending feeds into health score, budgets, coach & more", color: "#3B82F6" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: `${item.color}20`, color: item.color }}>
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>

          {/* Supported platforms */}
          <AnimatedCard>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4">Supported Platforms</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "Banks", examples: "Chase, SBI, HDFC, BoA", icon: "B", color: "#3B82F6" },
                  { name: "Credit Cards", examples: "Visa, Mastercard, Amex", icon: "C", color: "#FBBF24" },
                  { name: "Payment Apps", examples: "PayPal, Venmo, Revolut", icon: "P", color: "#8B5CF6" },
                  { name: "Neobanks", examples: "Chime, N26, Monzo", icon: "N", color: "#10B981" },
                ].map((p) => (
                  <div key={p.name} className="p-4 rounded-xl bg-white/2 border border-white/6 text-center">
                    <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-sm font-bold mb-2"
                      style={{ background: `${p.color}15`, color: p.color }}>
                      {p.icon}
                    </div>
                    <h4 className="text-sm font-semibold">{p.name}</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">{p.examples}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedCard>

          {/* Security note */}
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/2 border border-white/6">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p className="text-xs text-gray-500">
              Your bank credentials are never stored by MoniqoFi. All connections are encrypted with 256-bit TLS through Plaid — trusted by Venmo, Robinhood & millions of users.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
