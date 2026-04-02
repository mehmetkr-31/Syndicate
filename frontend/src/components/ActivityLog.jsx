import React from "react";

const TYPE_CONFIG = {
  deposit: {
    icon: "💰",
    color: "text-green-400",
    bg: "bg-green-900/20 border-green-800/40",
    label: (e) => `${e.memberName} deposited ${e.amount?.toFixed(4)} ETH`,
  },
  propose: {
    icon: "📋",
    color: "text-amber-400",
    bg: "bg-amber-900/20 border-amber-800/40",
    label: (e) => `${e.memberName} proposed sending ${e.amount?.toFixed(4)} ETH to ${e.to?.slice(0, 12)}…${e.description ? ` — "${e.description}"` : ""}`,
  },
  vote: {
    icon: "🗳",
    color: e => e.vote === "yes" ? "text-green-400" : "text-red-400",
    bg: e => e.vote === "yes" ? "bg-green-900/20 border-green-800/40" : "bg-red-900/20 border-red-800/40",
    label: (e) => `${e.memberName} voted ${e.vote?.toUpperCase()} on proposal ${e.proposalId?.slice(0, 8)}…`,
  },
  execute: {
    icon: "🔐",
    color: "text-blue-400",
    bg: "bg-blue-900/20 border-blue-800/40",
    label: (e) => `OWS executed transfer of ${e.amount?.toFixed(4)} ETH to ${e.to?.slice(0, 12)}…`,
    extra: (e) => e.owsSigned ? (
      <span className="text-green-400 text-xs">Signed by OWS ✓ · {e.txHash?.slice(0, 14)}…</span>
    ) : null,
  },
};

function EventRow({ event }) {
  const cfg = TYPE_CONFIG[event.type] ?? {
    icon: "·",
    color: "text-gray-400",
    bg: "bg-gray-900 border-gray-800",
    label: (e) => e.type,
  };

  const color = typeof cfg.color === "function" ? cfg.color(event) : cfg.color;
  const bg    = typeof cfg.bg    === "function" ? cfg.bg(event)    : cfg.bg;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${bg}`}>
      <span className="text-lg mt-0.5 shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${color}`}>{cfg.label(event)}</p>
        {cfg.extra && cfg.extra(event)}
      </div>
      <time className="text-xs text-gray-600 shrink-0 mt-0.5">
        {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        <br />
        <span className="text-gray-700">{new Date(event.timestamp).toLocaleDateString()}</span>
      </time>
    </div>
  );
}

export default function ActivityLog({ history }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Activity Log</h2>
        <p className="text-sm text-gray-400 mt-1">
          Full chronological record of all pool events — deposits, proposals, votes, and OWS-signed transfers.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center text-gray-500">
          No activity yet. Start by depositing ETH.
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
          {history.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
