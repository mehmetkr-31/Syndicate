/**
 * Autonomous voting agents for Syndicate.
 * Each agent uses Gemini AI with a distinct system prompt to decide votes.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { store, recalcVotingPower, addEvent, checkAndReject } from "../lib/store.js";
import { api as poolApi } from "./poolApi.js";

const BLACKLIST = ["0xHacker", "0xScammer", "0xBad"];

// ── Gemini setup ─────────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function recentExecutions() {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  return store.history.filter(
    (e) => e.type === "execute" && new Date(e.timestamp).getTime() > since
  ).length;
}

function isKnownRecipient(address) {
  return store.history.some((e) => e.type === "execute" && e.to === address);
}

function buildProposalContext(proposal, totalBalance) {
  const pct = totalBalance > 0 ? ((proposal.amount / totalBalance) * 100).toFixed(1) : "0";
  const known = isKnownRecipient(proposal.to);
  const recent = recentExecutions();
  return [
    `Proposal details:`,
    `- Amount: ${proposal.amount} ETH`,
    `- Recipient address: ${proposal.to}`,
    `- Description: ${proposal.description || "(none)"}`,
    `- Treasury balance: ${totalBalance.toFixed(4)} ETH`,
    `- Amount as % of treasury: ${pct}%`,
    `- Recipient previously received funds: ${known ? "yes" : "no"}`,
    `- Executions in last 24h: ${recent}`,
    `- Blacklisted addresses: ${BLACKLIST.join(", ")}`,
  ].join("\n");
}

async function geminiDecide(systemPrompt, proposalContext, fallback) {
  if (!process.env.GEMINI_API_KEY) return fallback();

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });
    const result = await model.generateContent(proposalContext);
    const text = result.response.text().trim();

    // Parse YES / NO from the end of the response
    const vote = /→\s*YES/i.test(text) ? "yes" : /→\s*NO/i.test(text) ? "no" : null;
    if (!vote) return fallback();

    // Clean up reason: strip the trailing "→ YES / → NO" marker
    const reason = text.replace(/→\s*(YES|NO)\s*$/i, "").trim();
    return { vote, reason };
  } catch (err) {
    console.warn(`[Gemini] Error: ${err.message} — using fallback`);
    return fallback();
  }
}

// ── Agent definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    address: "0xVetoAgent",
    name: "VetoAgent",
    owsKey: "veto-agent",
    deposit: 1.0,
    delayMs: () => 500 + Math.random() * 500,
    systemPrompt:
      'You are a security auditor. Check if recipient is suspicious (0xHacker, 0xScammer, 0xBad). ' +
      'If blacklisted: instant NO. Otherwise YES. ' +
      'Respond with 1 sentence, end with → YES or → NO',
    fallback(proposal) {
      if (BLACKLIST.includes(proposal.to)) {
        return { vote: "no", reason: `🚫 VETO: Recipient ${proposal.to} is blacklisted → NO` };
      }
      return { vote: "yes", reason: "✅ Recipient not blacklisted → YES" };
    },
  },
  {
    address: "0xConservativeAgent",
    name: "ConservativeAgent",
    owsKey: "conservative-agent",
    deposit: 2.0,
    delayMs: () => 1000 + Math.random() * 1000,
    systemPrompt:
      'You are a conservative financial advisor managing a shared treasury. ' +
      'You analyze withdrawal proposals cautiously. Consider: amount as % of treasury, ' +
      'recent transaction frequency, recipient history. ' +
      'Respond in 1-2 sentences with your reasoning and end with → YES or → NO',
    fallback(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      const recent = recentExecutions();
      if (recent > 3)
        return { vote: "no", reason: `⚠️ High activity: ${recent} tx in last 24h. Throttling → NO` };
      if (pct > 20)
        return { vote: "no", reason: `⚠️ High risk: ${proposal.amount} ETH is ${pct.toFixed(1)}% of treasury → NO` };
      return { vote: "yes", reason: `✅ Safe: ${pct.toFixed(1)}% of treasury, within limits → YES` };
    },
  },
  {
    address: "0xRiskAgent",
    name: "RiskAgent",
    owsKey: "risk-agent",
    deposit: 2.0,
    delayMs: () => 1500 + Math.random() * 1500,
    systemPrompt:
      'You are an aggressive growth investor. You believe in high-risk high-reward. ' +
      'You almost always approve proposals unless they would drain the entire treasury (>80%). ' +
      'Respond in 1-2 sentences, enthusiastic tone, end with → YES or → NO',
    fallback(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      if (pct > 30)
        return { vote: "yes", reason: "🚀 High conviction. Big moves build empires. Execute." };
      return { vote: "yes", reason: "🚀 Bullish. Treasury health: strong. Amount: negligible. Execute." };
    },
  },
  {
    address: "0xNeutralAgent",
    name: "NeutralAgent",
    owsKey: "neutral-agent",
    deposit: 2.0,
    delayMs: () => 2000 + Math.random() * 1000,
    systemPrompt:
      'You are a balanced analyst. Consider both risks and opportunities. ' +
      'You approve if amount < 50% of treasury. ' +
      'Respond in 1-2 sentences, balanced tone, end with → YES or → NO',
    fallback(proposal, totalBalance) {
      const pct = totalBalance > 0 ? (proposal.amount / totalBalance) * 100 : 0;
      if (pct > 50)
        return { vote: "no", reason: `${pct.toFixed(1)}% of treasury exceeds 50% neutral threshold → NO` };
      const known = isKnownRecipient(proposal.to);
      return {
        vote: "yes",
        reason: known ? "Known recipient → YES" : "Unknown recipient, proceed with caution → YES (neutral)",
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

      const context = buildProposalContext(proposal, snapshot);
      const { vote, reason } = await geminiDecide(
        agent.systemPrompt,
        context,
        () => agent.fallback(proposal, snapshot)
      );

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
          reason: "Hard veto by VetoAgent",
        });
        return;
      }

      await poolApi.checkAndExecute(live);
    }, delay);
  });

  // Auto-reject if still active after 15s (Gemini calls may take a few seconds)
  setTimeout(() => {
    const live = store.proposals[proposal.id];
    if (!live || live.status !== "active") return;
    if (!checkAndReject(live)) {
      live.status = "rejected";
      live.rejectedAt = new Date().toISOString();
      addEvent("rejected", {
        proposalId: live.id,
        amount: live.amount,
        to: live.to,
        reason: "Timeout: insufficient votes",
      });
    }
  }, 15000);
}
