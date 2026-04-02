import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

export default function ProposeWithdrawal({ state, onSuccess }) {
  const members      = state?.members?.filter((m) => m.balance > 0) ?? [];
  const totalBalance = state?.totalBalance ?? 0;

  const [proposer, setProposer] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [toast,    setToast]    = useState(null);

  // Uncontrolled refs — values read from DOM at submit time so any input
  // method (typing, browser automation, paste) works correctly.
  const toRef          = useRef(null);
  const amountRef      = useRef(null);
  const descriptionRef = useRef(null);

  // Initialize proposer once members load
  useEffect(() => {
    if (!proposer && members.length > 0) {
      setProposer(members[0].address);
    }
  }, [members.length]);

  async function handleSubmit(e) {
    e.preventDefault();

    const to          = toRef.current?.value?.trim() ?? "";
    const amount      = parseFloat(amountRef.current?.value ?? "");
    const description = descriptionRef.current?.value?.trim() ?? "";

    console.log("[Syndicate] propose submit →", { proposer, to, amount, description });

    if (!proposer || !to || !amount || amount <= 0) {
      console.warn("[Syndicate] propose blocked — missing fields", { proposer, to, amount });
      setToast({ ok: false, msg: `Missing fields: proposer=${proposer||"—"} to=${to||"—"} amount=${amount||"—"}` });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    setLoading(true);
    try {
      const res = await api.propose(proposer, to, amount, description);
      console.log("[Syndicate] propose success →", res.proposal.id);
      setToast({ ok: true, msg: `Proposal created: ${res.proposal.id.slice(0, 8)}…` });
      if (toRef.current)          toRef.current.value = "";
      if (amountRef.current)      amountRef.current.value = "";
      if (descriptionRef.current) descriptionRef.current.value = "";
      onSuccess?.();
    } catch (err) {
      console.error("[Syndicate] propose error →", err.message);
      setToast({ ok: false, msg: err.message });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Propose Withdrawal</h2>
        <p className="text-sm text-gray-400 mt-1">
          Propose sending ETH from the treasury. A vote will be triggered — majority (&gt;51%) must approve before OWS executes the transfer.
        </p>
      </div>

      {toast && (
        <div className={`rounded-lg px-4 py-3 text-sm ${toast.ok ? "bg-green-900/40 border border-green-700/50 text-green-400" : "bg-red-900/40 border border-red-700/50 text-red-400"}`}>
          {toast.ok ? "✓ " : "⚠ "}{toast.msg}
          {toast.ok && <span className="ml-2 text-green-500">→ Head to the Vote tab to approve!</span>}
        </div>
      )}

      {members.length === 0 ? (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-6 text-center text-gray-500">
          No members with a balance yet. Make deposits first.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl bg-gray-900 border border-gray-800 p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Proposer</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              value={proposer}
              onChange={(e) => setProposer(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.address} value={m.address}>
                  {m.name} ({m.votingPower.toFixed(1)}% voting power)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Send To (Address)</label>
            <input
              ref={toRef}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-brand-500"
              defaultValue="0xRecipient000000000000000000000000000000"
              placeholder="0x..."
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">
              Amount (ETH) — Treasury: {totalBalance.toFixed(4)} ETH
            </label>
            <input
              ref={amountRef}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              type="number"
              step="0.001"
              min="0.001"
              max={totalBalance}
              placeholder="0.0"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Description (optional)</label>
            <input
              ref={descriptionRef}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              placeholder="What's this for?"
            />
          </div>

          {/* Policy reminder */}
          <div className="rounded-lg bg-gray-800/60 border border-gray-700 px-3 py-2.5 flex items-start gap-2 text-xs text-gray-400">
            <span className="text-amber-400 mt-0.5">🔐</span>
            <span>
              OWS <code className="bg-gray-700 px-1 rounded">withdrawal-policy</code> will block execution
              until ≥51% of voting power approves. Votes are weighted by each member's ETH balance.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm transition-colors"
          >
            {loading ? "Creating Proposal…" : "Create Proposal"}
          </button>
        </form>
      )}
    </div>
  );
}
