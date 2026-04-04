import React, { useState, useEffect, useRef } from "react";
import { api } from "../api";

function useTypewriter(lines, resetKey, charDelay = 15, lineDelay = 350) {
  const [out, setOut] = useState([]);
  const [done, setDone] = useState(false);
  const cancel = useRef(false);
  const state = useRef({ li: 0, ci: 0 });

  useEffect(() => {
    setOut([]);
    setDone(false);
    state.current = { li: 0, ci: 0 };
  }, [resetKey]);

  useEffect(() => {
    cancel.current = false;
    if (!lines || lines.length === 0) { 
       if (state.current.li === 0) setDone(true);
       return; 
    }
    
    // Refresh already typed lines to catch any synchronous updates from parent (e.g. state changes)
    setOut(prev => {
      let isChanged = false;
      const synced = prev.map((item, idx) => {
        if (idx < state.current.li && lines[idx]) {
           if (item.text !== lines[idx].text || item.color !== lines[idx].color) {
             isChanged = true;
             return { ...lines[idx], text: lines[idx].text };
           }
        }
        return item;
      });
      return isChanged ? synced : prev;
    });

    if (state.current.li >= lines.length) {
       setDone(true);
       return;
    }
    setDone(false);

    function tick() {
      if (cancel.current) return;
      let { li, ci } = state.current;
      if (li >= lines.length) { 
        setDone(true); 
        return; 
      }

      setOut(prev => {
        const newOut = [...prev];
        const line = lines[li];
        if (!newOut[li]) newOut[li] = { ...line, text: "" };
        
        // Sync any past lines just in case
        for (let i = 0; i < li; i++) {
           if (newOut[i] && lines[i]) {
              newOut[i] = { ...lines[i], text: lines[i].text };
           }
        }
        
        newOut[li] = { ...line, text: line.text.slice(0, ci + 1) };
        return newOut;
      });

      state.current.ci++;
      if (state.current.ci >= lines[li].text.length) {
        state.current.li++; 
        state.current.ci = 0;
        setTimeout(tick, lineDelay);
      } else {
        setTimeout(tick, charDelay);
      }
    }

    setTimeout(tick, 30);
    return () => { cancel.current = true; };
  }, [lines, charDelay, lineDelay]);

  return { out, done };
}

/* ── Agent config matching stitch visuals ─── */
const AGENT_CONFIG = {
  VetoAgent: {
    role: "Compliance Logic",
    color: "text-primary",
    border: "border-primary",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD8J2SnbqlFDUV5z_pclIsmCM45aWl4bPErrWKaMqoGs3LMxNEAD4jVEYEoZTq7S4E-aWa2ZBEPyIuSMIOARugfHOPhCdtym2qjTT_SDcVnlUkQUOp9Qw_mL6qiNaTGvOuK9lzxultmOJC_3hJtLYyMTCDQFYS-vsmG5HL5k1AMloicMl-JzRcvfmJLACkrae7-goN64QNarxgEFSqhDkf5msjLbkGljlbwDOKv43MEHWP4IOy6lmbq1sEY4wy9l3TeNwSzV13nnrtZ"
  },
  ConservativeAgent: {
    role: "Risk Mitigation",
    color: "text-secondary",
    border: "border-secondary",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAkVDVsRU4HtHDC7ZfyW4Ns7K2vId4wrUsTcMj8Ty7L-2PjuK77K8FwShxGRPm8RojH6wS63iOLEvONIogcBc_oW1dSLGdZ1Pet3Bn4ucrRJfygwY0N0IxpJofKxeFlQ_NZjsTjjQLBRP4XMWfdlcxyEPuCoWWnYV2WyqZzo0eobxVB6kZbuPhvd5vGS8x5A3FrX5OV7R02GJF3o1NXxooSvdlAMb-t4-7dg-DQ84YsuymFLTrylwPhxLJxry-A4CMZPOOx8yDOWhUt"
  },
  GrowthAgent: {
    role: "Treasury Yield",
    color: "text-on-surface-variant",
    border: "border-outline-variant/40",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Tajn0VB639xNKM1Q8UUW1mloqgPkoht56KijYL2ioDp6Z3jB1BVH137QrZF6jDKamMGE348IvaJXpFjE7y67KdP6kjIDqMCg5xWd4x6AnqtNxcAdUfd7XzLGgcl1atIhdSn0Wy1l1BM2q4U-ue1NFaamW0jmMzLM4gKOAuEEUZeu-m0Q9TmeN3D1Axykl3UDgNhPAt5kN-ZQHY8Oqpts_kTM9Rx19yPUfyhTZOHIONCIk5rYkZE-7_EcVpAf3zAHSP-ONn4AqhID"
  },
  NeutralAgent: {
     role: "Yield Analysis",
     color: "text-tertiary",
     border: "border-tertiary",
     avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA3Tajn0VB639xNKM1Q8UUW1mloqgPkoht56KijYL2ioDp6Z3jB1BVH137QrZF6jDKamMGE348IvaJXpFjE7y67KdP6kjIDqMCg5xWd4x6AnqtNxcAdUfd7XzLGgcl1atIhdSn0Wy1l1BM2q4U-ue1NFaamW0jmMzLM4gKOAuEEUZeu-m0Q9TmeN3D1Axykl3UDgNhPAt5kN-ZQHY8Oqpts_kTM9Rx19yPUfyhTZOHIONCIk5rYkZE-7_EcVpAf3zAHSP-ONn4AqhID" // Reuse GrowthAgent placeholder for Neutral
  }
};

export default function Council({ state, onSuccess }) {
  const members = state?.members ?? [];
  const humans  = members.filter(m => !m.isAgent);
  const agents  = members.filter(m => m.isAgent);
  const active  = (state?.proposals ?? []).filter(p => p.status === "active");
  const latest  = active[0] ?? null;

  const [proposer, setProposer]         = useState(humans[0]?.address || "");
  const [toAddress, setToAddress]       = useState("");
  const [amount, setAmount]             = useState("");
  const [description, setDescription]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState(null);

  const [lines, setLines] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!humans.length) {
      if (proposer) setProposer("");
      return;
    }

    const stillExists = humans.some(member => member.address === proposer);
    if (!proposer || !stillExists) {
      setProposer(humans[0].address);
    }
  }, [humans, proposer]);

  useEffect(() => {
    if (!latest) {
      setLines([
        { type: "sys",   text: "Council Chamber terminal live." },
        { type: "sys",   text: "Awaiting proposal submission..." },
      ]);
      return;
    }

    const script = [
      { type: "sys",     text: "Initializing secure session..." },
      { type: "sys",     text: "Connected to SYNDICATE_MAINNET_NODE_04" },
      { type: "event",   text: `Proposal submitted... ID: ${latest.id.slice(0, 8).toUpperCase()}` },
      { type: "divider", text: "━━━━━━━━━━━━━━ AGENT DELIBERATION ━━━━━━━━━━━━━━" },
    ];

    let allAgentsVoted = true;

    agents.forEach(a => {
      const config = AGENT_CONFIG[a.name] || AGENT_CONFIG.VetoAgent;
      const voteObj = latest.votes.find(v => v.member === a.address);

      if (voteObj) {
        script.push({ type: "agent", agent: a.name, color: config.color, text: `Analyzing treasury impact of ${latest.amount.toFixed(2)} ETH.` });
        if (voteObj.vote === "no") {
           script.push({ type: "pass", color: "text-error", text: `🚫 VETO: ${voteObj.reason}` });
        } else {
           script.push({ type: "pass", color: config.color, text: `✅ CLEARANCE: ${voteObj.reason}` });
        }
      } else {
        allAgentsVoted = false;
        script.push({ type: "agent", agent: a.name, color: config.color, text: `Analyzing treasury impact of ${latest.amount.toFixed(2)} ETH...` });
      }
    });

    if (allAgentsVoted || latest.status === "rejected" || latest.status === "executed") {
      script.push({ type: "net", text: "Broadcasting deliberation signals to all active agents..." });
      const yesVP = latest.votes.filter(v => v.vote === "yes").reduce((sum, v) => sum + (members.find(m => m.address === v.member)?.votingPower || 0), 0);
      const noVP = latest.votes.filter(v => v.vote === "no").reduce((sum, v) => sum + (members.find(m => m.address === v.member)?.votingPower || 0), 0);
      const totalVP = yesVP + noVP || 1;
      const yesPct = ((yesVP / totalVP) * 100).toFixed(1);
      script.push({ type: "result", text: `${yesPct}% YES` });
      script.push({ type: "status", text: latest.status === "rejected" ? "PROPOSAL REJECTED" : "CONSENSUS REACHED" });
    }
    
    setLines(script);
  }, [latest?.id, latest?.status, latest?.votes?.length, agents.length]);

  const { out, done } = useTypewriter(lines, latest?.id, 10, 300);

  // Dedicated fast-polling loop to get agent votes instantly instead of waiting 5 seconds
  useEffect(() => {
    let id;
    if (latest && latest.status === "active") {
      id = setInterval(() => { if (onSuccess) onSuccess(); }, 1500);
    }
    return () => { if (id) clearInterval(id); };
  }, [latest?.id, latest?.status, onSuccess]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [out]);

  async function handlePropose() {
    if (!proposer || !toAddress || !amount || isNaN(amount) || Number(amount) <= 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await api.propose(proposer, toAddress, parseFloat(amount), description);
      setToAddress(""); setAmount(""); setDescription("");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-12 gap-8 animate-fade-in-up pb-12">
      
      {/* LEFT COLUMN */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
        <section className="bg-surface-container-low p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline font-bold text-xl tracking-tighter uppercase text-on-surface">Submit Proposal</h2>
            <span className="font-mono text-[10px] tracking-[0.2em] text-on-surface-variant uppercase">MOD_ID: CONV_049</span>
          </div>
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">Proposer Selector</label>
              <select 
                value={proposer}
                onChange={e => setProposer(e.target.value)}
                className="w-full bg-surface-container-lowest border-none border-b border-outline-variant/40 text-on-surface font-mono text-xs focus:border-primary focus:ring-0 py-3 uppercase tracking-wider cursor-pointer"
              >
                {humans.map(m => (
                  <option key={m.address} value={m.address}>{m.name}_{m.address.slice(0, 6).toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">Recipient Address</label>
              <input 
                type="text"
                value={toAddress}
                onChange={e => setToAddress(e.target.value)}
                className="w-full bg-surface-container-lowest border-none border-b border-outline-variant/40 text-on-surface font-mono text-xs focus:border-primary focus:ring-0 py-3 tracking-wider" 
                placeholder="0x..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">Amount (ETH)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-surface-container-lowest border-none border-b border-outline-variant/40 text-on-surface font-mono text-xs focus:border-primary focus:ring-0 py-3" 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">Priority</label>
                <div className="h-10 flex items-center gap-2">
                  <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse"></span>
                  <span className="text-tertiary font-mono text-xs uppercase tracking-tighter">Standard_Deliberation</span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">Proposal Description</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-surface-container-lowest border-none border-b border-outline-variant/40 text-on-surface font-mono text-xs focus:border-primary focus:ring-0 py-3 resize-none uppercase tracking-tight" 
                placeholder="DEFINE OBJECTIVES..." 
                rows="4"
              ></textarea>
            </div>
            {error && <p className="font-mono text-xs text-error border-l-2 border-error pl-3">{error}</p>}
            <button 
              onClick={handlePropose}
              disabled={isSubmitting || !toAddress || !amount}
              className="w-full bg-tertiary text-on-tertiary font-headline font-extrabold uppercase py-4 tracking-[0.3em] text-xs shadow-[0_0_15px_rgba(255,189,94,0.3)] hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>⚡ Convene Council</span>
            </button>
          </div>
        </section>

        <section className="bg-surface-container-low p-6">
          <h3 className="font-headline font-bold text-xs tracking-widest uppercase text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">groups</span> Council Members
          </h3>
          <div className="space-y-2">
            {agents.map(a => {
              const config = AGENT_CONFIG[a.name] || AGENT_CONFIG.VetoAgent;
              return (
                <div key={a.address} className={`bg-surface-container flex items-center justify-between p-3 border-l-2 ${config.border}`}>
                  <div className="flex items-center gap-3">
                    <img src={config.avatar} className="w-8 h-8 bg-surface-container-lowest border border-outline-variant/20" alt={a.name} />
                    <div>
                      <p className={`font-mono text-xs ${config.color} tracking-tighter`}>{a.name}</p>
                      <p className="font-body text-[9px] text-on-surface-variant uppercase tracking-widest">{config.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-on-surface tracking-widest">{a.votingPower.toFixed(2)} VP</p>
                    <p className="font-body text-[8px] text-primary uppercase tracking-widest">ACTIVE</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN - Terminal Chamber */}
      <div className="col-span-12 lg:col-span-7">
        <div className="bg-surface-container-lowest h-[calc(100vh-160px)] flex flex-col border border-outline-variant/10">
          <div className="bg-surface-container-high px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-error-container/50 border border-error-container"></div>
                <div className="w-2.5 h-2.5 bg-tertiary-container/50 border border-tertiary-container"></div>
                <div className="w-2.5 h-2.5 bg-primary-container/50 border border-primary-container"></div>
              </div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant ml-2">agent-council-chamber</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
              <span className="font-mono text-[10px] text-primary uppercase tracking-widest">● LIVE</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 font-mono text-sm space-y-4 [&::-webkit-scrollbar]:hidden">
            {out.map((line, i) => {
              if (line.type === "sys") return <div key={i} className="text-primary opacity-60">{line.text}</div>;
              if (line.type === "event") return (
                <div key={i} className="pt-4 flex items-center gap-3">
                  <span className="text-primary">⏳</span>
                  <span className="text-primary" style={{ textShadow: "0 0 8px rgba(164, 255, 185, 0.5)" }}>{line.text}</span>
                </div>
              );
              if (line.type === "divider") return (
                <div key={i} className="py-4 text-center text-primary-dim tracking-[0.2em] font-bold">{line.text}</div>
              );
              if (line.type === "agent") return (
                <div key={i} className="flex gap-3">
                  <span className={line.color}>[{line.agent}]:</span>
                  <span className="text-on-surface opacity-90">{line.text}</span>
                </div>
              );
              if (line.type === "pass") return (
                <div key={i} className={`flex gap-3 ml-10 ${line.color}`}><span>✅</span> <span>{line.text}</span></div>
              );
              if (line.type === "net") return (
                <div key={i} className="flex gap-3">
                  <span className="text-tertiary">[Network]:</span>
                  <span className="text-on-surface opacity-90 italic">{line.text}</span>
                </div>
              );
              if (line.type === "result") return (
                <div key={i} className="my-12 flex flex-col items-center justify-center space-y-2">
                   <div className="text-4xl font-headline font-black text-primary tracking-tighter" style={{ textShadow: "0 0 15px rgba(164, 255, 185, 0.5)" }}>{line.text}</div>
                </div>
              );
              if (line.type === "status") return (
                <div key={i} className="text-center">
                  <div className="text-[10px] text-primary uppercase tracking-[0.5em] font-bold">{line.text}</div>
                </div>
              );
              return null;
            })}
            {!done && <span className="text-primary animate-pulse inline-block">_</span>}
          </div>

          <div className="bg-surface-container-low px-4 py-2 border-t border-outline-variant/10 flex justify-between">
            <div className="flex gap-4">
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">CPU_LOAD: 12%</span>
              <span className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">AGENT_QUORUM: {agents.length || "0"}/4</span>
            </div>
            <span className="font-mono text-[9px] text-secondary uppercase tracking-widest">ENCRYPTED_SSL_CHAMBER</span>
          </div>
        </div>
      </div>
    </div>
  );
}
