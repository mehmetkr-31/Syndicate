import React, { useState } from "react";
import { api } from "../api.js";

const DEMO_MEMBERS = [
  { address: "0xAlice", name: "Alice" },
  { address: "0xBob",   name: "Bob"   },
  { address: "0xCarol", name: "Carol" },
];

export default function Deposit({ state, onSuccess }) {
  const [address, setAddress]   = useState(DEMO_MEMBERS[0].address);
  const [name,    setName]      = useState(DEMO_MEMBERS[0].name);
  const [amount,  setAmount]    = useState("1.0");
  const [loading, setLoading]   = useState(false);
  const [toast,   setToast]     = useState(null);
  const [custom,  setCustom]    = useState(false);
  const [mpLoading, setMpLoading] = useState(false);

  async function handleMoonPay() {
    setMpLoading(true);
    try {
      const res = await fetch("/pool/deposit/moonpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberName: name || address }),
      });
      const data = await res.json();
      if (data.depositUrl) {
        window.open(data.depositUrl, "_blank", "noopener");
      } else {
        setToast({ ok: false, msg: data.error || "MoonPay link could not be created" });
        setTimeout(() => setToast(null), 5000);
      }
    } catch (err) {
      setToast({ ok: false, msg: err.message });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setMpLoading(false);
    }
  }

  function selectMember(m) {
    setAddress(m.address);
    setName(m.name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!address || !amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      const res = await api.deposit(address, name, Number(amount));
      setToast({ ok: true, msg: `Deposited ${Number(amount).toFixed(4)} ETH for ${res.member.name}` });
      onSuccess?.();
    } catch (err) {
      setToast({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  }

  const existing = state?.members ?? [];

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Deposit ETH</h2>
        <p className="text-sm text-gray-400 mt-1">
          Add ETH to the pool. Your voting power increases proportionally to your share.
        </p>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm ${toast.ok ? "bg-green-900/40 border border-green-700/50 text-green-400" : "bg-red-900/40 border border-red-700/50 text-red-400"}`}>
          {toast.ok ? "✓ " : "⚠ "}{toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-4">
        {/* Quick-select */}
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Select Member</label>
          <div className="flex gap-2 flex-wrap">
            {DEMO_MEMBERS.map((m) => (
              <button
                key={m.address}
                type="button"
                onClick={() => { selectMember(m); setCustom(false); }}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
                  ${address === m.address && !custom
                    ? "bg-brand-600 border-brand-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
              >
                {m.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setCustom(true); setAddress(""); setName(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
                ${custom
                  ? "bg-brand-600 border-brand-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                }`}
            >
              + Custom
            </button>
          </div>
        </div>

        {custom && (
          <>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Display name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>
          </>
        )}

        {!custom && (
          <div className="rounded-lg bg-gray-800 px-3 py-2.5 text-sm text-gray-300 font-mono">
            {address}
          </div>
        )}

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Amount (ETH)</label>
          <div className="flex gap-2">
            {["0.5", "1.0", "2.0", "5.0"].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`flex-1 py-1.5 rounded-lg text-sm border transition-colors
                  ${amount === v
                    ? "bg-brand-600 border-brand-500 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                  }`}
              >
                {v}
              </button>
            ))}
          </div>
          <input
            className="mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Custom amount"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !address || !amount}
          className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition-colors"
        >
          {loading ? "Processing…" : "Deposit ETH"}
        </button>
      </form>

      {/* MoonPay */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Fund with MoonPay</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Generate a deposit link — fund the treasury from any chain via MoonPay.
            </p>
          </div>
          <span className="text-xs bg-blue-900/40 border border-blue-700/40 text-blue-400 px-2 py-0.5 rounded-full">
            Powered by MoonPay
          </span>
        </div>
        <button
          onClick={handleMoonPay}
          disabled={mpLoading}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          {mpLoading ? (
            "Creating deposit link…"
          ) : (
            <>
              <span>🌙</span> Fund with MoonPay
            </>
          )}
        </button>
        <p className="text-xs text-gray-600">
          Deposits any crypto → auto-converts to ETH → settles to Syndicate treasury on Base.
        </p>
      </div>

      {/* Current balances */}
      {existing.filter((m) => m.balance > 0).length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Current Balances</h3>
          <div className="space-y-2">
            {existing.filter((m) => m.balance > 0).map((m) => (
              <div key={m.address} className="flex justify-between text-sm">
                <span className="text-white">{m.name}</span>
                <span className="text-gray-400">{m.balance.toFixed(4)} ETH <span className="text-gray-600">({m.votingPower.toFixed(1)}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
