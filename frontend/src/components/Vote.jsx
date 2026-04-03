import React, { useState } from "react";
import { api } from "../api.js";

function VotePowerBar({ yesVotes, noVotes, members, totalBalance }) {
  const getBalance = (addr) => members.find((m) => m.address === addr)?.balance ?? 0;
  const yesPct = totalBalance > 0
    ? (yesVotes.reduce((s, v) => s + getBalance(v.member), 0) / totalBalance) * 100
    : 0;
  const noPct = totalBalance > 0
    ? (noVotes.reduce((s, v)  => s + getBalance(v.member), 0) / totalBalance) * 100
    : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-gray-500">
        <span className="text-green-400">YES {yesPct.toFixed(1)}%</span>
        <span className="text-red-400">NO {noPct.toFixed(1)}%</span>
      </div>
      <div className="relative w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
          style={{ width: `${yesPct}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-red-500 transition-all duration-500"
          style={{ width: `${noPct}%` }}
        />
      </div>
      {/* 51% threshold marker */}
      <div className="relative w-full h-2">
        <div className="absolute top-0 h-3 w-px bg-amber-400" style={{ left: "51%" }}>
          <span className="absolute -top-4 left-1 text-xs text-amber-400 whitespace-nowrap">51%</span>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({ proposal, members, totalBalance, voter, onVote }) {
  const [loading, setLoading] = useState(false);
  const [owsResult, setOwsResult] = useState(null);

  const yesVotes = proposal.votes.filter((v) => v.vote === "yes");
  const noVotes  = proposal.votes.filter((v) => v.vote === "no");
  const myVote   = proposal.votes.find((v) => v.member === voter);

  async function castVote(vote) {
    setLoading(true);
    try {
      const res = await onVote(proposal.id, voter, vote);
      if (res?.owsResult) setOwsResult(res.owsResult);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${proposal.status === "executed" ? "bg-blue-950/20 border-blue-700/30" : "bg-gray-900 border-gray-800"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={proposal.status} />
            {proposal.owsSigned && (
              <span className="text-xs font-medium text-green-400 flex items-center gap-1">
                🔐 Signed by OWS ✓
              </span>
            )}
          </div>
          <p className="text-white font-medium">
            Send <span className="text-brand-400">{proposal.amount.toFixed(4)} ETH</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            To: <span className="font-mono">{proposal.to.slice(0, 16)}…</span>
          </p>
          {proposal.description && (
            <p className="text-sm text-gray-400 mt-1 italic">"{proposal.description}"</p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500 shrink-0">
          <p>by {proposal.proposerName}</p>
          <p>{new Date(proposal.createdAt).toLocaleString()}</p>
        </div>
      </div>

      {/* Vote bar */}
      <VotePowerBar
        yesVotes={yesVotes}
        noVotes={noVotes}
        members={members}
        totalBalance={totalBalance}
      />

      {/* Vote breakdown — human + agent */}
      <div className="space-y-1.5">
        {proposal.votes.length === 0 && (
          <p className="text-xs text-gray-600">No votes yet</p>
        )}
        {proposal.votes.map((v) => (
          <div key={v.member} className="flex items-start gap-2 text-xs">
            <span>{v.isAgent ? "🤖" : "👤"}</span>
            <span className={`font-medium ${v.vote === "yes" ? "text-green-400" : "text-red-400"}`}>
              {v.memberName} voted {v.vote.toUpperCase()}
            </span>
            {v.reason && (
              <span className="text-gray-500 italic">— {v.reason}</span>
            )}
            {v.isAgent && (
              <span className="ml-auto text-gray-600 font-mono shrink-0">OWS: {v.owsKey}</span>
            )}
          </div>
        ))}
      </div>

      {/* OWS execution result */}
      {(owsResult || proposal.txHash) && (
        <div className={`rounded-lg px-3 py-2.5 text-xs space-y-1 ${proposal.status === "executed" ? "bg-blue-900/30 border border-blue-700/40" : "bg-red-900/30 border border-red-700/40"}`}>
          {(owsResult?.executed || proposal.status === "executed") ? (
            <>
              <p className="text-green-400 font-semibold">🔐 OWS Executed ✓</p>
              <p className="text-gray-400">Wallet: <code className="bg-gray-800 px-1 rounded">syndicate-treasury</code></p>
              <p className="text-gray-400">Policy: <code className="bg-gray-800 px-1 rounded">withdrawal-policy</code></p>
              <p className="text-gray-400">Chain: <code className="bg-gray-800 px-1 rounded">eip155:84532</code></p>
              <p className="text-gray-400">YES Power: <span className="text-green-400">{owsResult?.yesPct ?? "—"}%</span></p>
              <p className="text-gray-400">TxHash: <span className="font-mono text-blue-400">{(proposal.txHash || owsResult?.txHash)?.slice(0, 20)}…</span></p>
            </>
          ) : (
            <p className="text-amber-400">⏳ {owsResult?.reason}</p>
          )}
        </div>
      )}

      {/* Vote buttons */}
      {proposal.status === "active" && voter && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={() => castVote("yes")}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
              ${myVote?.vote === "yes"
                ? "bg-green-600 border-green-500 text-white"
                : "bg-gray-800 border-gray-700 text-green-400 hover:bg-green-900/30 hover:border-green-700"
              } disabled:opacity-50`}
          >
            {loading ? "…" : myVote?.vote === "yes" ? "✓ Voted YES" : "Vote YES"}
          </button>
          <button
            onClick={() => castVote("no")}
            disabled={loading}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors
              ${myVote?.vote === "no"
                ? "bg-red-600 border-red-500 text-white"
                : "bg-gray-800 border-gray-700 text-red-400 hover:bg-red-900/30 hover:border-red-700"
              } disabled:opacity-50`}
          >
            {loading ? "…" : myVote?.vote === "no" ? "✓ Voted NO" : "Vote NO"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Vote({ state, onSuccess }) {
  const members       = state?.members ?? [];
  const allProposals  = state?.proposals ?? [];
  const totalBalance  = state?.totalBalance ?? 0;
  const activeMembers = members.filter((m) => !m.isAgent && m.balance > 0);

  const [voter,  setVoter]  = useState("");
  const [filter, setFilter] = useState("active");
  const [results, setResults] = useState({});

  // Sync voter to first human member once state loads
  React.useEffect(() => {
    if (!voter && activeMembers.length > 0) {
      setVoter(activeMembers[0].address);
    }
  }, [activeMembers.length]);

  const filtered = allProposals.filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  async function handleVote(proposalId, member, vote) {
    try {
      const res = await api.vote(proposalId, member, vote);
      setResults((prev) => ({ ...prev, [proposalId]: res.owsResult }));
      await onSuccess?.();
      return res;
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-white">Vote on Proposals</h2>
          <p className="text-sm text-gray-400 mt-1">
            Votes are weighted by your ETH balance. OWS executes the transfer when YES ≥ 51%.
          </p>
        </div>
        {activeMembers.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Voting as</label>
            <select
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500"
              value={voter}
              onChange={(e) => setVoter(e.target.value)}
            >
              {activeMembers.map((m) => (
                <option key={m.address} value={m.address}>
                  {m.name} ({m.votingPower.toFixed(1)}%)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit border border-gray-800">
        {["active", "executed", "rejected", "all"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors
              ${filter === f ? "bg-gray-700 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center text-gray-500">
          No {filter === "all" ? "" : filter} proposals. Create one in the Propose tab.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              members={members}
              totalBalance={totalBalance}
              voter={voter}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:   "bg-yellow-900/50 text-yellow-400 border-yellow-700/50",
    passed:   "bg-green-900/50  text-green-400  border-green-700/50",
    rejected: "bg-red-900/50    text-red-400    border-red-700/50",
    executed: "bg-blue-900/50   text-blue-400   border-blue-700/50",
  };
  const icons = { active: "", rejected: "❌ ", executed: "✅ " };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${map[status] ?? ""}`}>
      {icons[status] ?? ""}{status}
    </span>
  );
}
