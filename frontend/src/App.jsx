import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import Deposit from "./components/Deposit.jsx";
import ProposeWithdrawal from "./components/ProposeWithdrawal.jsx";
import Vote from "./components/Vote.jsx";
import ActivityLog from "./components/ActivityLog.jsx";
import Council from "./components/Council.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard",  icon: "🏛" },
  { id: "deposit",   label: "Deposit",    icon: "💰" },
  { id: "propose",   label: "Propose",    icon: "📋" },
  { id: "vote",      label: "Vote",       icon: "🗳" },
  { id: "log",       label: "Activity",   icon: "📜" },
  { id: "council",   label: "Council",    icon: "🤖" },
];

export default function App() {
  const [tab, setTab]         = useState("dashboard");
  const [state, setState]     = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([api.getState(), api.getHistory()]);
      setState(s);
      setHistory(h);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  const activeProposals = state?.proposals?.filter((p) => p.status === "active") ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Syndicate</h1>
              <p className="text-xs text-gray-400">Weighted Multisig Treasury</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-900/50 border border-green-700/50 text-green-400 px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              OWS Active
            </span>
            <span className="rounded-full bg-gray-800 text-gray-400 border border-gray-700 px-3 py-1">
              Base Sepolia
            </span>
            <button
              onClick={async () => {
                if (!confirm("Reset pool to demo baseline?")) return;
                await api.reset();
                await refresh();
              }}
              className="rounded-full bg-gray-800 text-gray-500 border border-gray-700 px-3 py-1 hover:text-red-400 hover:border-red-700 transition-colors"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </header>

      {/* OWS banner */}
      <div className="bg-brand-900/40 border-b border-brand-700/30">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 text-xs text-brand-400">
          <span className="text-brand-400">🔐</span>
          <span>All transfers signed by <strong>OWS</strong> wallet <code className="bg-gray-800 px-1 rounded">syndicate-treasury</code> · Policy: <code className="bg-gray-800 px-1 rounded">withdrawal-policy</code> · Chain: <code className="bg-gray-800 px-1 rounded">eip155:84532</code></span>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors
                ${tab === t.id
                  ? "text-brand-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-400"
                  : "text-gray-400 hover:text-gray-200"
                }`}
            >
              <span>{t.icon}</span>
              {t.label}
              {t.id === "vote" && activeProposals.length > 0 && (
                <span className="ml-1 rounded-full bg-brand-500 text-white text-xs w-4 h-4 flex items-center justify-center">
                  {activeProposals.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-900/30 border border-red-700/50 text-red-400 px-4 py-3 text-sm">
            ⚠ Backend unreachable: {error}. Make sure the backend is running on port 3010.
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            Loading pool state…
          </div>
        ) : (
          <>
            {tab === "dashboard" && <Dashboard state={state} />}
            {tab === "deposit"   && <Deposit   state={state} onSuccess={refresh} />}
            {tab === "propose"   && <ProposeWithdrawal state={state} onSuccess={() => { refresh(); setTab("vote"); }} />}
            {tab === "vote"      && <Vote      state={state} onSuccess={refresh} />}
            {tab === "log"       && <ActivityLog history={history} />}
            {tab === "council"   && <Council state={state} onSuccess={refresh} />}
          </>
        )}
      </main>

      <footer className="border-t border-gray-800 text-center text-xs text-gray-600 py-4">
        Syndicate · Powered by Open Wallet Standard · Built for hackathon demo
      </footer>
    </div>
  );
}
