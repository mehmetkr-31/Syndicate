/**
 * Autonomous voting agents for Syndicate.
 *
 * Each agent has its own OWS API key (simulated for demo) and votes
 * automatically when a new proposal is created.
 *
 * Production setup:
 *   ows key create --name conservative-agent --wallet syndicate-treasury --policy withdrawal-policy
 *   ows key create --name risk-agent         --wallet syndicate-treasury --policy withdrawal-policy
 *   ows key create --name neutral-agent      --wallet syndicate-treasury --policy withdrawal-policy
 *   ows key create --name veto-agent         --wallet syndicate-treasury --policy withdrawal-policy
 */

import { store, recalcVotingPower, addEvent, checkAndReject } from "../lib/store.js";
import { api as poolApi } from "./poolApi.js";

const BLACKLIST = ["0xHacker", "0xScammer", "0xBad"];

function recentExecutions() {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return store.history.filter(
    (e) => e.type === "execute" && new Date(e.timestamp).getTime() > since
  ).length;
}

function isKnownRecipient(address) {
  return store.history.some((e) => e.type === "execute" && e.to === address);
}

// ── Agent definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    address: "0xVetoAgent",
    name: "VetoAgent",
    owsKey: "veto-agent",
    deposit: 1.0,
    delayMs: () => 500 + Math.random() * 500, // 0.5–1 s (votes first)
    decide(proposal) {
      if (BLACKLIST.includes(proposal.to)) {
        return {
          vote: "no",
          reason: `🚫 VETO: Recipient ${proposal.to} is blacklisted → NO`,
        };
      }
      return {
        vote: "yes",
        reason: `✅ Recipient not blacklisted → YES`,
      };
    },
  },
  {
    address: "0xConservativeAgent",
    name: "ConservativeAgent",
    owsKey: "conservative-agent",
    deposit: 2.0,
    delayMs: () => 1000 + Math.random() * 1000, // 1–2 s
    decide(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      const recent = recentExecutions();
      if (recent > 3) {
        return {
          vote: "no",
          reason: `⚠️ High activity: ${recent} transactions in last 24h. Throttling → NO`,
        };
      }
      if (pct > 20) {
        return {
          vote: "no",
          reason: `⚠️ High risk: ${proposal.amount} ETH is ${pct.toFixed(1)}% of treasury. Exceeds safe threshold → NO`,
        };
      }
      return {
        vote: "yes",
        reason: `✅ Safe: ${proposal.amount} ETH is ${pct.toFixed(1)}% of treasury. Within limits → YES`,
      };
    },
  },
  {
    address: "0xRiskAgent",
    name: "RiskAgent",
    owsKey: "risk-agent",
    deposit: 2.0,
    delayMs: () => 1500 + Math.random() * 1500, // 1.5–3 s
    decide(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      if (pct > 30) {
        return {
          vote: "yes",
          reason: `🚀 High conviction. Big moves build empires. Execute.`,
        };
      }
      return {
        vote: "yes",
        reason: `🚀 Bullish. Treasury health: strong. Amount: negligible. Execute.`,
      };
    },
  },
  {
    address: "0xNeutralAgent",
    name: "NeutralAgent",
    owsKey: "neutral-agent",
    deposit: 2.0,
    delayMs: () => 2000 + Math.random() * 1000, // 2–3 s
    decide(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      if (pct > 50) {
        return {
          vote: "no",
          reason: `amount is ${pct.toFixed(1)}% of treasury, exceeds 50% neutral threshold → NO`,
        };
      }
      const known = isKnownRecipient(proposal.to);
      return {
        vote: "yes",
        reason: known
          ? `Known recipient → YES`
          : `Unknown recipient, proceed with caution → YES (neutral)`,
      };
    },
  },
];

// ── Ensure agents exist in store as members ──────────────────────────────────

export function registerAgents() {
  AGENTS.forEach((agent) => {
    if (!store.members[agent.address]) {
      store.members[agent.address] = {
        address: agent.address,
        name: agent.name,
        deposited: agent.deposit,
        withdrawn: 0,
        balance: agent.deposit,
        votingPower: 0,
        isAgent: true,
      };
      addEvent("deposit", {
        member: agent.address,
        memberName: agent.name,
        amount: agent.deposit,
        isAgent: true,
      });
    }
  });
  recalcVotingPower();
}

// ── Trigger all agents to vote on a proposal ────────────────────────────────

export function triggerAgentVotes(proposal) {
  const snapshot = store.totalBalance;

  AGENTS.forEach((agent) => {
    const delay = agent.delayMs();
    setTimeout(async () => {
      const live = store.proposals[proposal.id];
      if (!live || live.status !== "active") return;

      const { vote, reason } = agent.decide(proposal, snapshot);

      live.votes = live.votes.filter((v) => v.member !== agent.address);
      live.votes.push({
        member: agent.address,
        memberName: agent.name,
        vote,
        isAgent: true,
        owsKey: agent.owsKey,
        reason,
      });

      addEvent("agent_vote", {
        proposalId: proposal.id,
        agent: agent.name,
        owsKey: agent.owsKey,
        vote,
        reason,
      });

      // VetoAgent NO = hard veto: immediately reject
      if (agent.address === "0xVetoAgent" && vote === "no") {
        live.status = "rejected";
        live.rejectedAt = new Date().toISOString();
        addEvent("rejected", {
          proposalId: live.id,
          amount: live.amount,
          to: live.to,
          yesPct: "0",
          reason: `Hard veto by VetoAgent`,
        });
        return;
      }

      await poolApi.checkAndExecute(live);
    }, delay);
  });

  // Auto-reject if still active after 10s (timeout — all agents should have voted by then)
  setTimeout(() => {
    const live = store.proposals[proposal.id];
    if (!live || live.status !== "active") return;
    // Try normal rejection first (all voted + YES < 51%)
    if (!checkAndReject(live)) {
      // Force timeout rejection
      live.status = "rejected";
      live.rejectedAt = new Date().toISOString();
      addEvent("rejected", {
        proposalId: live.id,
        amount: live.amount,
        to: live.to,
        reason: "Timeout: insufficient votes",
      });
    }
  }, 10000);
}
