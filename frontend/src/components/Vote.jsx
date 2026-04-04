import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function Vote({ state, onSuccess }) {
  const members   = state?.members   ?? [];
  const proposals = state?.proposals ?? [];
  const humans    = members.filter(m => !m.isAgent);
  const totalVP   = members.reduce((sum, m) => sum + m.votingPower, 0) || 100;

  const [selectedVoter, setSelectedVoter] = useState(humans[0]?.address || "");
  const [filter, setFilter]               = useState("active");
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [votingId, setVotingId]           = useState(null);

  useEffect(() => {
    if (!humans.length) {
      if (selectedVoter) setSelectedVoter("");
      return;
    }

    const stillExists = humans.some(member => member.address === selectedVoter);
    if (!selectedVoter || !stillExists) {
      setSelectedVoter(humans[0].address);
    }
  }, [humans, selectedVoter]);

  const filtered = useMemo(() => {
    if (filter === "all") return proposals;
    return proposals.filter(p => p.status === filter);
  }, [proposals, filter]);

  async function handleVote(proposalId, voteType) {
    if (!selectedVoter) return;
    setIsSubmitting(true);
    setVotingId(proposalId);
    try {
      await api.vote(proposalId, selectedVoter, voteType);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert("Vote error: " + err.message);
    } finally {
      setIsSubmitting(false);
      setVotingId(null);
    }
  }

  const FILTERS = ["active", "executed", "rejected", "all"];

  return (
    <section className="max-w-4xl w-full mx-auto animate-fade-in-up pb-12">
      
      {/* Page header + voter profile selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tighter-2 text-on-surface mb-2 uppercase">Vote on Proposals</h1>
          <div className="chip-active">Governance Status: Decentralized</div>
        </div>

        <div className="flex flex-col gap-2 items-start md:items-end">
          <span className="font-label text-[10px] tracking-widest uppercase text-gray-500">Select Voter Profile</span>
          <div className="flex bg-surface-container-low border border-outline-variant/20 overflow-hidden">
            {humans.map(m => (
              <button 
                key={m.address}
                onClick={() => setSelectedVoter(m.address)}
                className={`px-5 py-2 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap transition-colors ${selectedVoter === m.address ? "text-primary bg-surface-container border-l-2 border-primary" : "text-gray-500 hover:text-on-surface"}`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/10 mb-8">
        {FILTERS.map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-6 py-3 font-mono text-[10px] tracking-widest uppercase whitespace-nowrap transition-colors ${filter === f ? "text-primary border-b border-primary" : "text-gray-500 hover:text-on-surface"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Proposal list */}
      <div className="space-y-6">
        {filtered.map(p => {
          const yesVP = p.votes.filter(v => v.vote === "yes").reduce((sum, v) => sum + (members.find(m => m.address === v.member)?.votingPower || 0), 0);
          const noVP = p.votes.filter(v => v.vote === "no").reduce((sum, v) => sum + (members.find(m => m.address === v.member)?.votingPower || 0), 0);
          const yesPct = (yesVP / totalVP) * 100;
          const noPct  = (noVP / totalVP) * 100;
          const busy   = isSubmitting && votingId === p.id;

          if (p.status === "active") {
            return (
              <div key={p.id} className="bg-surface-container-low border border-outline-variant/20 border-l-2 border-primary p-6 glow-primary relative">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 font-bold">Active</span>
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">ID: {p.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <h2 className="font-headline font-bold text-xl uppercase tracking-tighter text-on-surface">{p.description || "Treasury Directive"}</h2>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-xl text-primary font-bold">{p.amount.toFixed(2)} ETH</span>
                    <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest truncate max-w-[150px]">Target: {p.to}</p>
                  </div>
                </div>

                {/* Insufficient Power Warning */}
                {yesPct < 51 && (
                  <div className="bg-tertiary/10 border border-tertiary/20 p-3 mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-tertiary">⏳ Insufficient voting power: {yesPct.toFixed(1)}% YES (need 51%)</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest mb-2 text-primary">
                      <span>{yesPct.toFixed(1)}% YES</span>
                      <span className="text-gray-500">{yesVP.toFixed(1)} VP</span>
                    </div>
                    <div className="h-1 bg-surface-container-highest relative overflow-hidden">
                      <div className="h-full bg-primary animate-pulse-glow" style={{ width: `${yesPct}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest mb-2 text-error">
                      <span>{noPct.toFixed(1)}% NO</span>
                      <span className="text-gray-500">{noVP.toFixed(1)} VP</span>
                    </div>
                    <div className="h-1 bg-surface-container-highest relative overflow-hidden">
                      <div className="h-full bg-error" style={{ width: `${noPct}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container border-l-2 border-secondary p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-secondary text-sm">smart_toy</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">Agent Reasoning</span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant leading-relaxed italic opacity-80">
                    "Simulation indicates capital deployment for '{p.description}' aligns with risk parameters. Quorum pending."
                  </p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-outline-variant/10">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleVote(p.id, "yes")}
                      disabled={busy}
                      className="bg-primary text-on-primary px-8 py-3 font-headline font-extrabold text-xs tracking-widest uppercase hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {busy ? "voting..." : "Vote Yes"}
                    </button>
                    <button 
                      onClick={() => handleVote(p.id, "no")}
                      disabled={busy}
                      className="px-8 py-3 font-headline font-extrabold text-xs tracking-widest uppercase border border-outline-variant/30 text-gray-500 hover:border-error hover:text-error transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Vote No
                    </button>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="font-label text-[10px] text-gray-500 uppercase tracking-widest">Proposer</p>
                      <p className="font-mono text-xs text-on-surface">{p.proposerName}</p>
                    </div>
                    <div>
                      <p className="font-label text-[10px] text-gray-500 uppercase tracking-widest">Expires In</p>
                      <p className="font-mono text-xs text-primary">{timeAgo(p.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (p.status === "executed") {
            return (
              <div key={p.id} className="bg-surface-container-low border border-outline-variant/10 p-6 opacity-60 hover:opacity-100 transition-opacity">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant bg-surface-container-highest px-2 py-0.5">Executed</span>
                      <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">ID: {p.id.slice(0, 8).toUpperCase()}</span>
                    </div>
                    <h2 className="font-headline font-bold text-lg uppercase text-on-surface">{p.description}</h2>
                  </div>
                  <span className="font-mono text-lg text-gray-500 font-bold">{p.amount.toFixed(2)} ETH</span>
                </div>
                <div className="bg-primary/5 border border-primary/20 p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary">✓ Transaction signed — {p.to.slice(0, 12)}...</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-gray-600 cursor-pointer hover:text-primary">content_copy</span>
                </div>
                <div className="h-1 bg-surface-container-highest w-full relative">
                  <div className="h-full bg-gray-600" style={{ width: `${yesPct}%` }}></div>
                </div>
              </div>
            );
          }

          return (
            <div key={p.id} className="bg-surface-container-low border border-error/20 border-l-2 border-error p-6 opacity-60">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-error bg-error/10 px-2 py-0.5">Rejected</span>
                    <span className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">ID: {p.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <h2 className="font-headline font-bold text-lg uppercase text-on-surface">{p.description}</h2>
                </div>
                <span className="font-mono text-lg text-error font-bold">{p.amount.toFixed(2)} ETH</span>
              </div>
              <div className="h-1 bg-surface-container-highest w-full relative">
                <div className="h-full bg-error/40" style={{ width: `${noPct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
