import React from "react";

/* ── Agent colour map ───────────────────────────────────── */
const AGENT_COLORS = {
  ConservativeAgent: { text: "text-tertiary",   bar: "bg-tertiary",   border: "border-tertiary/20",   label: "Agent",   icon: "smart_toy" },
  RiskAgent:         { text: "text-error",      bar: "bg-error",      border: "border-error/20",      label: "Agent",   icon: "smart_toy" },
  NeutralAgent:      { text: "text-secondary",  bar: "bg-secondary",  border: "border-secondary/20",  label: "Agent",   icon: "smart_toy" },
  VetoAgent:         { text: "text-purple-400", bar: "bg-purple-400", border: "border-purple-400/20", label: "Council", icon: "smart_toy" },
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const STATUS_STYLE = {
  active:   { text: "text-primary",  bg: "bg-primary/10",  lborder: "border-primary" },
  executed: { text: "text-tertiary", bg: "bg-tertiary/10", lborder: "border-tertiary" },
  rejected: { text: "text-error",    bg: "bg-error/10",    lborder: "border-error" },
};

export default function Dashboard({ state, onNavigate }) {
  const members   = state?.members   ?? [];
  const proposals = state?.proposals ?? [];
  const total     = state?.totalBalance ?? 0;

  const activeCount   = proposals.filter(p => p.status === "active").length;
  const executedCount = proposals.filter(p => p.status === "executed").length;
  const recent = [...proposals]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="p-8 space-y-8 max-w-7xl animate-fade-in-up">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-outline-variant/10 bg-surface-container-low overflow-hidden">
        <div className="p-6 border-r border-outline-variant/10">
          <p className="font-label text-[10px] tracking-widest uppercase text-gray-500 mb-2">Treasury Balance</p>
          <p className="font-mono text-2xl font-bold text-on-surface">{total.toFixed(4)} <span className="text-primary-dim text-lg">ETH</span></p>
        </div>
        <div className="p-6 border-r border-outline-variant/10">
          <p className="font-label text-[10px] tracking-widest uppercase text-gray-500 mb-2">Members</p>
          <p className="font-mono text-2xl font-bold text-on-surface">{members.length}</p>
        </div>
        <div className="p-6 border-r border-outline-variant/10">
          <p className="font-label text-[10px] tracking-widest uppercase text-gray-500 mb-2">Active Proposals</p>
          <p className="font-mono text-2xl font-bold text-secondary">{activeCount}</p>
        </div>
        <div className="p-6">
          <p className="font-label text-[10px] tracking-widest uppercase text-gray-500 mb-2">Executed</p>
          <p className="font-mono text-2xl font-bold text-tertiary">{executedCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Members & Voting Power Table */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant/10 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline font-bold text-lg tracking-tight uppercase">Entities &amp; Consensus Weight</h2>
            <span className="font-mono text-[10px] text-primary/50">LIVE_DATA_FEED.SH</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="font-label text-[10px] tracking-widest uppercase text-gray-500 border-b border-outline-variant/10">
                  <th className="pb-3 px-2 font-medium">MEMBER</th>
                  <th className="pb-3 px-2 font-medium">ADDRESS</th>
                  <th className="pb-3 px-2 font-medium">VOTING POWER</th>
                  <th className="pb-3 px-2 font-medium">TYPE</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {members.map(m => {
                  const ac = AGENT_COLORS[m.name];
                  const colorClass = ac?.text  ?? "text-primary";
                  const barClass   = ac?.bar   ?? "bg-primary";
                  const borderClass= ac?.border?? "border-primary/20";
                  const label      = ac?.label ?? "Contributor";
                  const icon       = ac?.icon  ?? "person";

                  return (
                    <tr key={m.address} className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors group">
                      <td className="py-4 px-2 flex items-center gap-3">
                        <span className={`material-symbols-outlined ${colorClass}`}>{icon}</span>
                        <span className="text-on-surface">{m.name}</span>
                      </td>
                      <td className="py-4 px-2 text-gray-500">{m.address.slice(0, 6)}...{m.address.slice(-4)}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3 w-full max-w-[140px]">
                          <span className="w-10">{m.votingPower.toFixed(1)}%</span>
                          <div className="flex-1 h-1 bg-surface-variant overflow-hidden">
                            <div className={`h-full ${barClass}`} style={{ width: `${m.votingPower}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`${colorClass} border ${borderClass} px-2 py-0.5 text-[10px] uppercase`}>{label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strategic Directives */}
        <div className="bg-surface-container-low border border-outline-variant/10 p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline font-bold text-lg tracking-tight uppercase">Strategic Directives</h2>
          </div>
          <div className="flex-1 space-y-4">
            {recent.map(p => {
              const s = STATUS_STYLE[p.status] ?? STATUS_STYLE.active;
              return (
                <div 
                  key={p.id}
                  onClick={() => onNavigate?.("vote")}
                  className={`p-4 bg-surface-container border-l-2 ${s.lborder} hover:bg-surface-container-high cursor-pointer transition-all`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-mono ${s.text} ${s.bg} px-2 py-0.5 uppercase tracking-widest`}>{p.status}</span>
                    <span className="font-mono text-[10px] text-gray-500">{timeAgo(p.createdAt)}</span>
                  </div>
                  <h3 className="font-label text-sm font-semibold text-on-surface mb-1">{p.amount.toFixed(1)} ETH ➔ {p.description || "Treasury Directive"}</h3>
                  <div className="flex items-center justify-between font-mono text-[10px] text-gray-400">
                    <span>FROM: {p.proposerName}</span>
                    <span>{p.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && (
              <div className="text-center py-10 opacity-30 font-mono text-[10px] uppercase tracking-widest">No strategic directives indexed</div>
            )}
          </div>
          <button 
            onClick={() => onNavigate?.("activity")}
            className="w-full mt-6 py-3 border border-outline-variant/20 font-label text-[10px] tracking-widest uppercase hover:bg-surface-container-highest transition-colors"
          >
            View All Archives →
          </button>
        </div>
      </div>

      {/* Dashboard Background Visual (Topology Overlay) */}
      <div className="relative h-64 border border-outline-variant/10 bg-surface-container-lowest overflow-hidden group">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#262626 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-mono text-[10px] text-primary mb-2 tracking-[0.3em] uppercase opacity-50">Consensus Topology Overlay</div>
            <img 
              alt="Abstract visualization of a blockchain network" 
              className="h-32 w-full object-cover grayscale brightness-50 mix-blend-screen opacity-40 group-hover:opacity-60 transition-opacity" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdXLI4Sk1FsfCL6vhaWZd57mdyQV0zLSpc1nd-hjiSttp3soq6W3wADj0GqDb2XohLS2uysrISK63LvomwmKgTKvKEeSmY83OiGXx-RNr7p30NF2L0LCz4C-tZj2Am8DlCyYfIMQR1ffqtc2T2757n7lUE_83ZAJ5EVKabuFQdz2GPJq7YxUxAdPEDlNZ00ymd9GGtVJTFSepE-B8TMG5WcFEx00o37EUnpEN6lpuIUUp96Fhe6qYKxJkA7R82MK5XMKxgkUh3hMsn" 
            />
          </div>
        </div>
        <div className="absolute bottom-4 left-4 font-mono text-[8px] text-gray-600 uppercase tracking-widest">
          SYSTEM_STATUS: NOMINAL // ENCRYPTION: OWS_LAYER_3
        </div>
      </div>
    </div>
  );
}
