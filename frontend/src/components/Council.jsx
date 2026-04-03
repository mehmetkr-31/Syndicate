import React, { useState, useEffect, useRef } from "react";
import { api } from "../api.js";

const AGENT_META = {
  VetoAgent:           { color: "#a855f7", role: "Security Auditor · 1 ETH" },
  ConservativeAgent:   { color: "#eab308", role: "Financial Advisor · 2 ETH" },
  RiskAgent:           { color: "#ef4444", role: "Growth Investor · 2 ETH" },
  NeutralAgent:        { color: "#3b82f6", role: "Balanced Analyst · 2 ETH" },
};

// ── Typing-effect line component ─────────────────────────────────────────────
function TypingText({ text, color = "#d1d5db", speed = 16 }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text]);
  return <span style={{ color }}>{shown}</span>;
}

// ── Single terminal line ──────────────────────────────────────────────────────
function TermLine({ line }) {
  if (line.typing) {
    return (
      <div className="font-mono text-sm leading-relaxed min-h-[1.4em]">
        {line.prefix && (
          <span style={{ color: line.prefixColor }} className="font-bold">
            {line.prefix}
          </span>
        )}
        <TypingText text={line.text} color={line.color} />
      </div>
    );
  }
  return (
    <div
      className={`font-mono text-sm leading-relaxed min-h-[1.4em] ${line.bold ? "font-bold" : ""}`}
      style={{ color: line.color || "#4ade80" }}
    >
      {line.text}
    </div>
  );
}

// ── Council page ──────────────────────────────────────────────────────────────
let _lineId = 0;
const mkLine = (props) => ({ id: ++_lineId, ...props });

export default function Council({ state, onSuccess }) {
  const humanMembers = (state?.members ?? []).filter((m) => !m.isAgent && m.balance > 0);

  const [proposer, setProposer]   = useState("");
  const [loading, setLoading]     = useState(false);
  const [proposalId, setProposalId] = useState(null);
  const [phase, setPhase]         = useState("idle"); // idle | polling | done
  const [lines, setLines]         = useState([
    mkLine({ text: "Agent Council Chamber initialized.", color: "#4ade80" }),
    mkLine({ text: "Awaiting proposal...",               color: "#6b7280" }),
    mkLine({ text: "",                                   color: "#4ade80" }),
  ]);

  const toRef   = useRef();
  const amtRef  = useRef();
  const descRef = useRef();
  const bottomRef = useRef();
  const seenRef   = useRef(new Set()); // tracks already-displayed vote addresses
  const phaseRef  = useRef("idle");

  // Sync phaseRef so polling closure sees latest value
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  // Init proposer once state loads
  useEffect(() => {
    if (!proposer && humanMembers.length > 0) setProposer(humanMembers[0].address);
  }, [humanMembers.length]);

  const addLine = (props) =>
    setLines((prev) => [...prev, mkLine(props)]);

  // ── Polling ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!proposalId || phase !== "polling") return;

    const interval = setInterval(async () => {
      if (phaseRef.current !== "polling") return;
      try {
        const s = await api.getState();
        const p = s.proposals.find((x) => x.id === proposalId);
        if (!p) return;

        // Display newly-arrived votes
        for (const vote of p.votes) {
          if (seenRef.current.has(vote.member)) continue;
          seenRef.current.add(vote.member);

          const agentColor = AGENT_META[vote.memberName]?.color ?? "#4ade80";
          const voteLabel  = vote.vote === "yes" ? "→ APPROVED ✅" : "→ REJECTED ❌";
          const voteColor  = vote.vote === "yes" ? "#4ade80" : "#ef4444";

          setLines((prev) => [
            ...prev,
            mkLine({
              typing: true,
              prefix: `[${vote.memberName}]: `,
              prefixColor: agentColor,
              text: vote.reason ?? "...",
              color: "#d1d5db",
            }),
            mkLine({ text: voteLabel, color: voteColor }),
            mkLine({ text: "", color: "#4ade80" }),
          ]);
        }

        // Verdict when proposal is resolved
        if (p.status !== "active") {
          clearInterval(interval);
          phaseRef.current = "done";
          setPhase("done");

          const allMembers   = s.members;
          const totalBalance = allMembers.reduce((s, m) => s + m.balance, 0);
          const yesPower     = p.votes
            .filter((v) => v.vote === "yes")
            .reduce((acc, v) => acc + (allMembers.find((m) => m.address === v.member)?.balance ?? 0), 0);
          const pct = totalBalance > 0 ? ((yesPower / totalBalance) * 100).toFixed(1) : "0";

          setTimeout(() => {
            setLines((prev) => {
              const extra = [
                mkLine({ text: "━━━━━━━━━━ COUNCIL VERDICT ━━━━━━━━━━", color: "#fbbf24", bold: true }),
              ];

              if (p.status === "executed") {
                extra.push(mkLine({ text: `${pct}% YES — CONSENSUS REACHED`, color: "#4ade80", bold: true }));
                extra.push(mkLine({ text: "🔐 OWS signing transaction...", color: "#60a5fa" }));
                extra.push(mkLine({ text: `✓ Transaction signed: ${p.txHash?.slice(0, 22) ?? "0x..."}...`, color: "#4ade80" }));
              } else {
                extra.push(mkLine({ text: `${pct}% YES — PROPOSAL REJECTED`, color: "#ef4444", bold: true }));
              }

              return [...prev, ...extra];
            });
            onSuccess?.();
          }, 400);
        }
      } catch (_) { /* ignore transient fetch errors */ }
    }, 500);

    return () => clearInterval(interval);
  }, [proposalId, phase]);

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const to     = toRef.current?.value?.trim();
    const amount = parseFloat(amtRef.current?.value);
    const desc   = descRef.current?.value?.trim() ?? "";
    if (!to || !amount || !proposer) return;

    setLoading(true);
    seenRef.current = new Set();
    setPhase("idle");
    setProposalId(null);

    setLines([
      mkLine({ text: "⏳ Proposal submitted. Convening agent council...", color: "#fbbf24" }),
      mkLine({ text: "", color: "#4ade80" }),
    ]);

    try {
      const res = await api.propose(proposer, to, amount, desc);
      const pid  = res.proposal.id;

      setLines((prev) => [
        ...prev,
        mkLine({ text: `Proposal : ${pid.slice(0, 8)}…`,  color: "#6b7280" }),
        mkLine({ text: `Amount   : ${amount} ETH`,        color: "#6b7280" }),
        mkLine({ text: `To       : ${to.slice(0, 20)}…`,  color: "#6b7280" }),
        mkLine({ text: "",                                 color: "#4ade80" }),
        mkLine({ text: "━━━━━━ AGENT DELIBERATION ━━━━━━", color: "#9ca3af" }),
        mkLine({ text: "",                                 color: "#4ade80" }),
      ]);

      setProposalId(pid);
      setPhase("polling");
    } catch (err) {
      addLine({ text: `✗ Error: ${err.message}`, color: "#ef4444" });
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-2 gap-6" style={{ height: "calc(100vh - 196px)" }}>

      {/* ── Left: proposal form ── */}
      <div className="flex flex-col gap-5 overflow-y-auto pr-1">
        <div>
          <h2 className="text-lg font-semibold text-white">Submit Proposal</h2>
          <p className="text-sm text-gray-400 mt-1">
            AI agents deliberate and vote in real-time inside the council chamber.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {humanMembers.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Proposing as</label>
              <select
                value={proposer}
                onChange={(e) => setProposer(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              >
                {humanMembers.map((m) => (
                  <option key={m.address} value={m.address}>
                    {m.name} ({m.balance.toFixed(2)} ETH)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Recipient Address</label>
            <input
              ref={toRef}
              type="text"
              placeholder="0x…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Amount (ETH)</label>
            <input
              ref={amtRef}
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.5"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <textarea
              ref={descRef}
              rows={3}
              placeholder="What is this payment for?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || phase === "polling"}
            className="w-full py-3 rounded-lg font-semibold text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting…" : phase === "polling" ? "⏳ Council deliberating…" : "⚡ Convene Council"}
          </button>
        </form>

        {/* Agent legend */}
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Council Members</p>
          {Object.entries(AGENT_META).map(([name, { color, role }]) => (
            <div key={name} className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs font-mono font-medium" style={{ color }}>{name}</span>
              <span className="text-xs text-gray-600">{role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: terminal ── */}
      <div className="rounded-xl border border-gray-700 bg-black overflow-hidden flex flex-col">
        {/* macOS-style titlebar */}
        <div className="px-4 py-2.5 bg-gray-900/80 border-b border-gray-700/60 flex items-center gap-2 shrink-0">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs text-gray-500 font-mono ml-3">agent-council-chamber — syndicate-treasury</span>
        </div>

        {/* Terminal output */}
        <div className="flex-1 overflow-y-auto p-5 space-y-0.5">
          {lines.map((line) => (
            <TermLine key={line.id} line={line} />
          ))}
          {phase === "polling" && (
            <div className="font-mono text-sm text-green-500 animate-pulse">█</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
