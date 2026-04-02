/**
 * OWS (Open Wallet Standard) integration layer.
 *
 * In production this would call the actual OWS CLI / SDK:
 *   ows wallet create --name syndicate-treasury
 *   ows key create --name syndicate-agent --wallet syndicate-treasury --policy withdrawal-policy
 *
 * For the hackathon demo we simulate OWS signing so the UI flow is fully
 * demonstrable without a live OWS daemon.  The policy evaluation logic is
 * identical to what the real withdrawal-policy executable would run.
 */

import { store } from "./store.js";

// Simulated OWS wallet address (would come from `ows wallet show syndicate-treasury`)
export const TREASURY_ADDRESS = "0xSYNDICATE_TREASURY_0000000000000000000000";

// OWS policy evaluation — mirrors policies/withdrawal-policy.js exactly
function evaluatePolicy(proposal) {
  const yesVotes = (proposal.votes || []).filter((v) => v.vote === "yes");
  const totalPower = Object.values(store.members).reduce(
    (s, m) => s + m.balance,
    0
  );
  if (totalPower === 0) {
    return { allow: false, reason: "No funds in treasury" };
  }
  const yesPower = yesVotes.reduce((s, v) => {
    const member = store.members[v.member];
    return s + (member ? member.balance : 0);
  }, 0);
  const pct = (yesPower / totalPower) * 100;
  if (pct >= 51) {
    return { allow: true, yesPct: pct.toFixed(1) };
  }
  return {
    allow: false,
    reason: `Insufficient voting power: ${pct.toFixed(1)}% YES (need 51%)`,
  };
}

/**
 * Attempt an OWS-gated transfer.
 * Returns { success, txHash, owsSigned, reason? }
 */
export async function owsTransfer(proposal) {
  const policy = evaluatePolicy(proposal);

  if (!policy.allow) {
    return { success: false, owsSigned: false, reason: policy.reason };
  }

  // Simulate signing delay (OWS daemon round-trip)
  await new Promise((r) => setTimeout(r, 400));

  // In production:
  //   const result = await fetch("http://localhost:4040/v1/sign", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${OWS_API_KEY}` },
  //     body: JSON.stringify({ to: proposal.to, value: proposal.amount, chainId: "eip155:84532" }),
  //   });
  //   const { txHash } = await result.json();

  const txHash =
    "0x" +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");

  return {
    success: true,
    owsSigned: true,
    txHash,
    yesPct: policy.yesPct,
    wallet: "syndicate-treasury",
    chain: "eip155:84532",
    policy: "withdrawal-policy",
  };
}
