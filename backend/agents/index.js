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
 */

import { store, addEvent } from "../lib/store.js";
import { api as poolApi } from "./poolApi.js";

// ── Agent definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    address: "0xAgent_Conservative",
    name: "ConservativeAgent",
    owsKey: "conservative-agent",
    delayMs: () => 1000 + Math.random() * 1000, // 1–2 s
    decide(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      if (pct > 20) {
        return {
          vote: "no",
          reason: `amount is ${pct.toFixed(1)}% of treasury, exceeds 20% safe threshold → NO`,
        };
      }
      return {
        vote: "yes",
        reason: `amount is ${pct.toFixed(1)}% of treasury, within 20% safe threshold → YES`,
      };
    },
  },
  {
    address: "0xAgent_Risk",
    name: "RiskAgent",
    owsKey: "risk-agent",
    delayMs: () => 1500 + Math.random() * 1500, // 1.5–3 s
    decide(_proposal, _totalBalance) {
      return { vote: "yes", reason: "always bullish → YES" };
    },
  },
  {
    address: "0xAgent_Neutral",
    name: "NeutralAgent",
    owsKey: "neutral-agent",
    delayMs: () => 2000 + Math.random() * 1000, // 2–3 s
    decide(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      if (pct > 50) {
        return {
          vote: "no",
          reason: `amount is ${pct.toFixed(1)}% of treasury, exceeds 50% neutral threshold → NO`,
        };
      }
      return {
        vote: "yes",
        reason: `amount is ${pct.toFixed(1)}% of treasury, within 50% neutral threshold → YES`,
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
        deposited: 0,
        withdrawn: 0,
        balance: 0,
        votingPower: 0,
        isAgent: true,
      };
    }
  });
}

// ── Trigger all agents to vote on a proposal ────────────────────────────────

export function triggerAgentVotes(proposal) {
  const snapshot = store.totalBalance;

  AGENTS.forEach((agent) => {
    const delay = agent.delayMs();
    setTimeout(async () => {
      // Re-read proposal in case it was already executed
      const live = store.proposals[proposal.id];
      if (!live || live.status !== "active") return;

      const { vote, reason } = agent.decide(proposal, snapshot);

      // Remove any prior vote by this agent
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

      // Check if threshold is now met — trigger OWS execution via poolApi
      await poolApi.checkAndExecute(live);
    }, delay);
  });
}
