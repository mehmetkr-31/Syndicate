import { Router } from "express";
import { v4 as uuid } from "uuid";
import { execFile } from "child_process";
import { promisify } from "util";
import { store, recalcVotingPower, addEvent } from "../lib/store.js";
import { owsTransfer, TREASURY_ADDRESS } from "../lib/ows.js";
import { triggerAgentVotes } from "../agents/index.js";

const execFileAsync = promisify(execFile);

const router = Router();

// ── GET /pool/state ──────────────────────────────────────────────────────────
router.get("/state", (req, res) => {
  recalcVotingPower();
  res.json({
    totalBalance: store.totalBalance,
    members: Object.values(store.members),
    proposals: Object.values(store.proposals).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    ),
  });
});

// ── GET /pool/history ────────────────────────────────────────────────────────
router.get("/history", (req, res) => {
  res.json(store.history);
});

// ── POST /pool/deposit ───────────────────────────────────────────────────────
// Body: { address, name?, amount }
router.post("/deposit", (req, res) => {
  const { address, name, amount } = req.body;
  if (!address || !amount || amount <= 0) {
    return res.status(400).json({ error: "address and positive amount required" });
  }

  if (!store.members[address]) {
    store.members[address] = {
      address,
      name: name || address.slice(0, 8),
      deposited: 0,
      withdrawn: 0,
      balance: 0,
      votingPower: 0,
    };
  } else if (name) {
    store.members[address].name = name;
  }

  const member = store.members[address];
  member.deposited += Number(amount);
  member.balance += Number(amount);

  recalcVotingPower();

  addEvent("deposit", {
    member: address,
    memberName: member.name,
    amount: Number(amount),
  });

  res.json({ success: true, member: store.members[address] });
});

// ── POST /pool/propose ───────────────────────────────────────────────────────
// Body: { proposer, to, amount, description? }
router.post("/propose", (req, res) => {
  const { proposer, to, amount, description } = req.body;
  if (!proposer || !to || !amount || amount <= 0) {
    return res.status(400).json({ error: "proposer, to, and positive amount required" });
  }
  if (!store.members[proposer]) {
    return res.status(400).json({ error: "Proposer is not a pool member" });
  }
  if (Number(amount) > store.totalBalance) {
    return res.status(400).json({ error: "Amount exceeds treasury balance" });
  }

  const proposal = {
    id: uuid(),
    proposer,
    proposerName: store.members[proposer]?.name || proposer,
    to,
    amount: Number(amount),
    description: description || "",
    status: "active",
    votes: [],
    createdAt: new Date().toISOString(),
  };

  store.proposals[proposal.id] = proposal;

  addEvent("propose", {
    proposalId: proposal.id,
    member: proposer,
    memberName: proposal.proposerName,
    to,
    amount: proposal.amount,
    description: proposal.description,
  });

  // Autonomous agents vote asynchronously (1–3 s delay each)
  triggerAgentVotes(proposal);

  res.json({ success: true, proposal });
});

// ── POST /pool/vote ──────────────────────────────────────────────────────────
// Body: { proposalId, member, vote: "yes"|"no" }
router.post("/vote", async (req, res) => {
  const { proposalId, member, vote } = req.body;
  if (!proposalId || !member || !["yes", "no"].includes(vote)) {
    return res.status(400).json({ error: "proposalId, member, and vote (yes|no) required" });
  }

  const proposal = store.proposals[proposalId];
  if (!proposal) return res.status(404).json({ error: "Proposal not found" });
  if (proposal.status !== "active") {
    return res.status(400).json({ error: `Proposal is ${proposal.status}` });
  }
  if (!store.members[member]) {
    return res.status(400).json({ error: "Voter is not a pool member" });
  }

  // Replace existing vote if any
  proposal.votes = proposal.votes.filter((v) => v.member !== member);
  proposal.votes.push({ member, vote, memberName: store.members[member]?.name });

  recalcVotingPower();
  addEvent("vote", {
    proposalId,
    member,
    memberName: store.members[member]?.name,
    vote,
  });

  // Check if proposal has reached threshold → attempt OWS execution
  const result = await owsTransfer(proposal);

  if (result.success) {
    proposal.status = "executed";
    proposal.txHash = result.txHash;
    proposal.executedAt = new Date().toISOString();
    proposal.owsSigned = true;

    // Deduct from proposer's balance (withdrawal)
    // In a real system the treasury sends ETH; we track it against the pool
    store.totalBalance -= proposal.amount;
    // Proportional deduction — simplest demo approach: reduce all balances pro-rata
    const ratio = proposal.amount / (store.totalBalance + proposal.amount);
    for (const m of Object.values(store.members)) {
      const cut = m.balance * ratio;
      m.withdrawn += cut;
      m.balance -= cut;
    }
    recalcVotingPower();

    addEvent("execute", {
      proposalId,
      amount: proposal.amount,
      to: proposal.to,
      txHash: result.txHash,
      owsSigned: true,
      yesPct: result.yesPct,
    });
  }

  res.json({
    success: true,
    proposal,
    owsResult: result.success
      ? {
          executed: true,
          txHash: result.txHash,
          owsSigned: result.owsSigned,
          yesPct: result.yesPct,
          wallet: result.wallet,
          chain: result.chain,
          policy: result.policy,
        }
      : {
          executed: false,
          reason: result.reason,
        },
  });
});

// ── POST /pool/deposit/moonpay ────────────────────────────────────────────────
// Body: { memberName? }  — creates a MoonPay deposit link for the treasury
router.post("/deposit/moonpay", async (req, res) => {
  const { memberName } = req.body;
  const label = memberName
    ? `Syndicate — ${memberName}`
    : "Syndicate Treasury";

  try {
    // Resolve mp binary (globally installed via npm i -g @moonpay/cli)
    const mpBin = process.env.MP_BIN || "mp";

    const { stdout, stderr } = await execFileAsync(mpBin, [
      "deposit", "create",
      "--name",   label,
      "--wallet", TREASURY_ADDRESS,
      "--chain",  "base",
      "--token",  "ETH",
    ], { timeout: 30_000 });

    // mp outputs JSON to stdout
    let data;
    try {
      data = JSON.parse(stdout);
    } catch {
      // Fallback: extract URL from plain-text output
      const match = (stdout + stderr).match(/https?:\/\/\S+/);
      data = { url: match?.[0] ?? null, raw: stdout.trim() };
    }

    const depositUrl = data?.url || data?.depositUrl || data?.link || null;

    addEvent("moonpay_deposit_link", {
      memberName: label,
      depositUrl,
    });

    res.json({ success: true, depositUrl, raw: data });
  } catch (err) {
    // mp CLI not authenticated or not available — return a clear error
    res.status(502).json({
      success: false,
      error: err.message,
      hint: "Run `mp auth login` to authenticate the MoonPay CLI first.",
    });
  }
});

export default router;
