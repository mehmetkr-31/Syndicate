import React, { useState } from "react";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatDate(ts) {
  return new Date(ts).toISOString().replace("T", " | ").slice(0, 20) + " UTC";
}

const FILTERS = ["all", "deposits", "proposals", "votes", "executed", "rejected"];

function matchFilter(item, f) {
  if (f === "all") return true;
  if (f === "deposits"  && item.type === "deposit") return true;
  if (f === "proposals" && item.type === "propose") return true;
  if (f === "votes"     && (item.type === "vote" || item.type === "agent_vote")) return true;
  if (f === "executed"  && item.type === "execute") return true;
  if (f === "rejected"  && item.type === "rejected") return true;
  return false;
}

export default function ActivityLog({ history = [] }) {
  const [filter, setFilter] = useState("all");
  const filtered = history.filter(item => matchFilter(item, filter));

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up pb-12">
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold tracking-tighter-2 text-on-surface uppercase">Activity Log</h1>
        <p className="font-label text-[10px] tracking-widest uppercase text-gray-500 mt-2">Full chronological record of syndicate operations</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-surface-container-low p-1 border-b border-outline-variant/10">
        {FILTERS.map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${filter === f ? "bg-primary text-on-primary font-bold" : "text-gray-500 hover:text-white"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((item, idx) => {
          if (item.type === "execute") return (
            <div key={idx} className="group bg-surface-container-low border-l-2 border-primary p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container transition-colors">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-primary font-bold">OWS EXECUTED</span>
                    <span className="font-mono text-[8px] uppercase border border-primary/20 bg-primary/10 text-primary px-1.5 py-0.5">Confirmed</span>
                  </div>
                  <p className="font-mono text-sm text-gray-400">{item.to} — Automated secure settlement complete.</p>
                  <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-black/40 border border-outline-variant/20 w-fit text-[10px] font-mono text-gray-500 hover:border-primary hover:text-primary transition-all cursor-pointer">
                    <span>TX: {item.txHash?.slice(0, 12)}...</span>
                    <span className="material-symbols-outlined text-[11px]">content_copy</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{timeAgo(item.timestamp)}</p>
                <p className="font-mono text-[9px] text-gray-600 mt-0.5">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          );

          if (item.type === "agent_vote") return (
            <div key={idx} className="group bg-surface-container-low border-l-2 border-secondary p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container transition-colors">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary mt-0.5">smart_toy</span>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-secondary font-bold">AGENT VOTE</span>
                    <span className="font-mono text-[8px] uppercase border border-secondary/20 bg-secondary/10 text-secondary px-1.5 py-0.5 font-bold">AUTONOMOUS</span>
                  </div>
                  <p className="font-mono text-sm text-gray-400">🤖 <span className="text-white font-bold">{item.agent}</span> voted <span className={item.vote === "yes" ? "text-primary" : "text-error"}>{item.vote.toUpperCase()}</span> — {item.proposalId.slice(0, 8).toUpperCase()}</p>
                  <div className="mt-2 text-[10px] font-mono text-gray-600 bg-black/40 p-2 border-l border-secondary/30">
                    OWS KEY: <span className="text-secondary">{item.owsKey}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{timeAgo(item.timestamp)}</p>
                <p className="font-mono text-[9px] text-gray-600 mt-0.5">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          );

          if (item.type === "propose") return (
            <div key={idx} className="group bg-surface-container-low border-l-2 border-tertiary p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container transition-colors">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-tertiary mt-0.5">description</span>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1 block">NEW PROPOSAL</span>
                  <p className="font-mono text-sm text-gray-400"><span className="text-white font-bold">{item.memberName}</span> requested {item.amount.toFixed(2)} ETH → {item.to.slice(0, 10)}...</p>
                  <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest mt-2">ID: {item.proposalId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{timeAgo(item.timestamp)}</p>
                <p className="font-mono text-[9px] text-gray-600 mt-0.5">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          );

          if (item.type === "deposit") return (
            <div key={idx} className="group bg-surface-container-low border-l-2 border-primary-dim p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container transition-colors">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-primary-dim mt-0.5">payments</span>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-primary-dim font-bold mb-1 block">VAULT DEPOSIT</span>
                  <p className="font-mono text-sm text-gray-400">+ <span className="text-white font-bold">{item.amount.toFixed(2)} ETH</span> from <span className="text-gray-200">{item.memberName}</span></p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{timeAgo(item.timestamp)}</p>
                <p className="font-mono text-[9px] text-gray-600 mt-0.5">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          );

          if (item.type === "vote") return (
            <div key={idx} className="group bg-surface-container-low border-l-2 border-gray-600 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container transition-colors">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-gray-500 mt-0.5">person</span>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">HUMAN VOTE</span>
                  <p className="font-mono text-sm text-gray-400">👤 <span className="text-white font-bold">{item.memberName}</span> voted <span className={item.vote === "yes" ? "text-primary" : "text-error"}>{item.vote.toUpperCase()}</span> — {item.proposalId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{timeAgo(item.timestamp)}</p>
                <p className="font-mono text-[9px] text-gray-600 mt-0.5">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          );

          return null;
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-surface-container-low border border-outline-variant/10 font-mono text-[10px] uppercase tracking-widest text-gray-600">No activity matching filter records found</div>
        )}
      </div>

      <div className="mt-10 flex justify-center">
        <button className="group px-8 py-4 bg-surface-container-low border border-outline-variant/20 font-mono text-[10px] tracking-widest text-gray-500 hover:text-primary hover:border-primary transition-all flex items-center gap-3 uppercase">
          <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">&gt;&gt;</span>
          FETCH_OLDER_RECORDS
          <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">&lt;&lt;</span>
        </button>
      </div>
    </div>
  );
}
