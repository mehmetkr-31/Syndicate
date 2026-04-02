import React from "react";

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function PowerBar({ pct, color = "bg-brand-500" }) {
  return (
    <div className="w-full bg-gray-800 rounded-full h-1.5">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-500`}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

const COLORS = [
  "bg-brand-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-teal-500",
  "bg-cyan-500",
];

export default function Dashboard({ state }) {
  if (!state) return null;

  const { totalBalance, members, proposals } = state;
  const active   = proposals.filter((p) => p.status === "active").length;
  const executed = proposals.filter((p) => p.status === "executed").length;

  const sortedMembers = [...members].sort((a, b) => b.balance - a.balance);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Treasury Balance"
          value={`${totalBalance.toFixed(4)} ETH`}
          sub="Base Sepolia"
        />
        <StatCard label="Members" value={members.length} sub="pool participants" />
        <StatCard label="Active Proposals" value={active} sub="awaiting votes" />
        <StatCard label="Executed" value={executed} sub="transfers completed" />
      </div>

      {/* OWS Wallet info */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-green-400 text-lg">🔐</span>
          <h2 className="font-semibold text-white">OWS Wallet — Signed ✓</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-gray-800 p-3">
            <p className="text-gray-500 text-xs mb-1">Wallet</p>
            <p className="text-green-400 font-mono text-xs">syndicate-treasury</p>
          </div>
          <div className="rounded-lg bg-gray-800 p-3">
            <p className="text-gray-500 text-xs mb-1">Policy</p>
            <p className="text-green-400 font-mono text-xs">withdrawal-policy</p>
          </div>
          <div className="rounded-lg bg-gray-800 p-3">
            <p className="text-gray-500 text-xs mb-1">Chain</p>
            <p className="text-green-400 font-mono text-xs">eip155:84532 (Base Sepolia)</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Every ETH transfer is gated by the OWS <code className="bg-gray-800 px-1 rounded">withdrawal-policy</code> executable.
          The policy checks that cumulative YES voting power ≥ 51% before allowing the signature.
        </p>
      </div>

      {/* Members */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
        <h2 className="font-semibold text-white mb-4">Members &amp; Voting Power</h2>
        {sortedMembers.length === 0 ? (
          <p className="text-gray-500 text-sm">No members yet. Make a deposit to join the pool.</p>
        ) : (
          <div className="space-y-4">
            {sortedMembers.map((m, i) => (
              <div key={m.address} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                    <span className="font-medium text-white">{m.name}</span>
                    <span className="text-gray-500 font-mono text-xs">{m.address.slice(0, 10)}…</span>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-gray-400 text-xs">{m.balance.toFixed(4)} ETH</span>
                    <span className={`font-bold text-sm ${COLORS[i % COLORS.length].replace("bg-", "text-")}`}>
                      {m.votingPower.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <PowerBar pct={m.votingPower} color={COLORS[i % COLORS.length]} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent proposals */}
      {proposals.length > 0 && (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
          <h2 className="font-semibold text-white mb-4">Recent Proposals</h2>
          <div className="space-y-2">
            {proposals.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm rounded-lg bg-gray-800 px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={p.status} />
                  <div>
                    <p className="text-white">{p.amount.toFixed(4)} ETH → <span className="font-mono text-xs text-gray-400">{p.to.slice(0, 12)}…</span></p>
                    <p className="text-gray-500 text-xs">by {p.proposerName} · {new Date(p.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {p.owsSigned && (
                  <span className="text-xs text-green-400 font-medium">OWS ✓</span>
                )}
              </div>
            ))}
          </div>
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
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
