import React, { useState } from "react";
import { api } from "../api";

export default function ProposeWithdrawal({ state, onSuccess }) {
  const members = state?.members ?? [];
  const humans = members.filter(m => !m.isAgent);
  const totalBalance = state?.totalBalance ?? 0;

  const [proposer, setProposer] = useState(humans[0]?.address || "");
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!proposer || !toAddress || !amount || isNaN(amount) || Number(amount) <= 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.propose(proposer, toAddress, parseFloat(amount), description);
      setToAddress("");
      setAmount("");
      setDescription("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-160px)] flex items-center justify-center relative overflow-hidden animate-fade-in-up">
      {/* Abstract Background Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <section className="w-full max-w-[600px] px-6 py-12 relative z-10">
        {/* Header Metadata */}
        <div className="flex justify-between items-end mb-4 border-b border-outline-variant/20 pb-2">
          <div>
            <span className="font-label text-[10px] tracking-[0.2em] text-gray-500 block uppercase">Operational Directive</span>
            <h1 className="font-headline font-extrabold text-3xl text-on-surface tracking-tighter uppercase">Propose Withdrawal</h1>
          </div>
          <div className="text-right">
            <span className="font-label text-[10px] tracking-[0.2em] text-gray-500 block uppercase">Protocol Status</span>
            <span className="font-label text-[10px] text-primary uppercase tracking-widest flex items-center gap-1 justify-end">
              <span className="w-1 h-1 bg-primary rounded-full animate-pulse"></span> Ready
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low p-8 border-none space-y-8">
          {/* Form Starts */}
          <div className="space-y-6">
            {/* Proposer */}
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">01 // SELECT PROPOSER</label>
              <div className="relative group">
                <select 
                  value={proposer}
                  onChange={e => setProposer(e.target.value)}
                  className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-on-surface font-body text-sm py-3 transition-all appearance-none cursor-pointer"
                >
                  {humans.map(m => (
                    <option key={m.address} value={m.address}>{m.name}</option>
                  ))}
                  {humans.length === 0 && <option value="">No human entities available</option>}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">expand_more</span>
              </div>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">02 // SEND TO (ADDRESS)</label>
              <input 
                type="text"
                value={toAddress}
                onChange={e => setToAddress(e.target.value)}
                className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-on-surface font-body text-sm py-3 transition-all placeholder:text-gray-700" 
                placeholder="0x..." 
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">03 // AMOUNT (ETH)</label>
                <span className="font-label text-[10px] text-secondary tracking-widest uppercase bg-secondary/10 px-2 py-0.5">Treasury: {totalBalance.toFixed(2)} ETH</span>
              </div>
              <input 
                type="number" 
                step="0.01" 
                min="0" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-on-surface font-body text-sm py-3 transition-all placeholder:text-gray-700" 
                placeholder="0.00" 
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="font-label text-[10px] tracking-widest text-on-surface-variant uppercase">04 // DESCRIPTION (OPTIONAL)</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-surface-container-lowest border-0 border-b border-outline-variant/40 focus:border-primary focus:ring-0 text-on-surface font-body text-sm py-3 transition-all placeholder:text-gray-700 resize-none" 
                placeholder="Contextualize this withdrawal..." 
                rows="3"
              ></textarea>
            </div>

            {/* Error Message */}
            {error && <p className="font-mono text-xs text-error border-l-2 border-error pl-3">{error}</p>}

            {/* Warning Box */}
            <div className="bg-tertiary/10 border-l-2 border-tertiary p-4 flex gap-4">
              <span className="material-symbols-outlined text-tertiary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              <p className="font-label text-xs text-tertiary leading-relaxed tracking-wide">
                🔐 OWS withdrawal-policy will block execution until ≥51% voting power approves. This action is recorded on the permanent ledger.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !proposer || !toAddress || !amount}
              className="group w-full bg-primary text-on-primary font-label font-bold text-xs tracking-[0.2em] py-4 flex items-center justify-center gap-2 hover:brightness-125 transition-all shadow-[0_0_20px_rgba(164,255,185,0.2)] hover:shadow-[0_0_30px_rgba(164,255,185,0.4)] disabled:opacity-50"
            >
              {isSubmitting ? "PROCESSING..." : "CREATE PROPOSAL"}
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="mt-8 flex justify-between items-center opacity-30">
          <div className="font-label text-[8px] tracking-[0.3em] uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-[10px]">fingerprint</span>
            X-TERM_HASH: 8829-AF2
          </div>
          <div className="font-label text-[8px] tracking-[0.3em] uppercase">
            SYNDICATE V2.4.1
          </div>
        </div>
      </section>
    </main>
  );
}
