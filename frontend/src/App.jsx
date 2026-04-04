import React, { useState, useEffect, useCallback } from "react";
import { api } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import Deposit from "./components/Deposit.jsx";
import ProposeWithdrawal from "./components/ProposeWithdrawal.jsx";
import Vote from "./components/Vote.jsx";
import ActivityLog from "./components/ActivityLog.jsx";
import Council from "./components/Council.jsx";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard" },
  { id: "deposit",   label: "Deposit",   icon: "account_balance_wallet" },
  { id: "propose",   label: "Propose",   icon: "add_box" },
  { id: "vote",      label: "Vote",      icon: "how_to_vote" },
  { id: "activity",  label: "Activity",  icon: "history" },
  { id: "council",   label: "Council",   icon: "groups" },
];

export default function App() {
  const [tab, setTab]         = useState("dashboard");
  const [state, setState]     = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);
  const [blockNum, setBlockNum] = useState("—");

  const refresh = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([api.getState(), api.getHistory()]);
      setState(s);
      setHistory(h);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);

  // Simulated block counter
  useEffect(() => {
    const base = 39700000;
    setBlockNum((base + Math.floor(Date.now() / 12000)).toLocaleString());
    const id = setInterval(() => {
      setBlockNum((base + Math.floor(Date.now() / 12000)).toLocaleString());
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const activeCount = state?.proposals?.filter(p => p.status === "active").length ?? 0;
  const executedCount = state?.proposals?.filter(p => p.status === "executed").length ?? 0;
  const tvl = state?.totalBalance ?? 0;

  async function handleReset() {
    if (!confirm("Reset pool to demo baseline?")) return;
    await api.reset();
    await refresh();
  }

  return (
    <div className="bg-background text-on-surface font-body min-h-screen selection:bg-primary selection:text-on-primary overflow-x-hidden min-h-screen">
      <div className="scanline-overlay" />

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-screen w-[240px] border-none bg-black flex flex-col py-6 px-0 z-50">
        <div className="px-6 mb-10">
          <div className="text-primary font-mono text-xl drop-shadow-[0_0_8px_rgba(164,255,185,0.5)] tracking-tighter font-bold">
            ⬡ SYNDICATE
          </div>
          <div className="font-label uppercase text-[10px] tracking-widest text-gray-500 mt-1">SOVEREIGN TERMINAL</div>
        </div>

        <nav className="flex-grow flex flex-col space-y-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={tab === item.id ? "nav-item-active" : "nav-item-idle"}
            >
              <span className="material-symbols-outlined mr-4 text-lg">{item.icon}</span>
              {item.label}
              {item.id === "vote" && activeCount > 0 && (
                <span className="ml-auto text-[10px] font-mono bg-primary text-on-primary px-1.5 py-0.5 leading-none">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto px-6 space-y-4">
          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center py-2 text-gray-500 font-mono text-xs tracking-widest uppercase hover:text-primary transition-all"
          >
            ↻ Reset
          </button>
          <div className="flex items-center px-4 py-2 bg-surface-container text-primary font-mono text-[10px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-xs mr-2">lock_open</span>
            🔐 OWS Connected
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`ml-[240px] min-h-screen flex flex-col bg-[#0e0e0e] ${tab === "propose" ? "grid-pattern" : ""}`}>
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 flex justify-between items-center w-full pl-8 pr-8 h-12 bg-transparent backdrop-blur-md border-b border-outline-variant/20">
          <div className="flex items-center gap-6">
            <span className="font-label text-[10px] tracking-widest uppercase text-primary">SYNDICATE OPS</span>
            <nav className="flex gap-4">
              <span className="font-label text-[10px] tracking-widest uppercase text-primary border-b border-primary cursor-pointer">TX_LOG</span>
              <span className="font-label text-[10px] tracking-widest uppercase text-gray-400 hover:text-secondary transition-colors cursor-pointer">GAS: 12 GWEI</span>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-primary">
            <div className="relative flex items-center">
              <input 
                className="bg-surface-container-lowest border-none text-[10px] font-mono tracking-widest text-primary placeholder-gray-600 focus:ring-0 w-48 py-1" 
                placeholder="SEARCH_TERMINAL..." 
                type="text"
                readOnly
              />
            </div>
            <span className="material-symbols-outlined text-sm cursor-pointer hover:text-secondary transition-all">settings</span>
            <span className="material-symbols-outlined text-sm cursor-pointer hover:text-secondary transition-all">terminal</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 p-8">
          {tab === "dashboard" && <Dashboard state={state} onNavigate={setTab} />}
          {tab === "deposit"   && <Deposit   state={state} onSuccess={refresh} />}
          {tab === "propose"   && <ProposeWithdrawal state={state} onSuccess={() => { refresh(); setTab("council"); }} />}
          {tab === "vote"      && <Vote      state={state} onSuccess={refresh} />}
          {tab === "activity"  && <ActivityLog history={history} />}
          {tab === "council"   && <Council   state={state} onSuccess={refresh} />}
        </div>

        {/* Footer Ticker */}
        <footer className="mt-auto border-t border-outline-variant/10 bg-black/50 py-2 overflow-hidden shrink-0">
          <div className="flex whitespace-nowrap gap-12 font-mono text-[9px] text-primary/60 tracking-widest animate-marquee uppercase">
            {[
              `DAI/USDT: 1.0001`,
              `ETH/USD: 2,491.12 ▲`,
              `LATEST BLOCK: ${blockNum}`,
              `GAS SPIKE DETECTED`,
              `DAO TREASURY ACTIVE`,
              `CONNECTED: OW_SYSTEM_01`,
              `DAI/USDT: 1.0001`,
              `ETH/USD: 2,491.12 ▲`,
              `LATEST BLOCK: ${blockNum}`,
              `GAS SPIKE DETECTED`,
              `DAO TREASURY ACTIVE`,
              `CONNECTED: OW_SYSTEM_01`,
            ].map((text, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary inline-block" />
                {text}
              </span>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
