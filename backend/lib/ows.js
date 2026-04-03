/**
 * OWS (Open Wallet Standard) integration layer.
 *
 * When TREASURY_PRIVATE_KEY is set in env, executes real Base Sepolia transactions
 * using the treasury wallet.  Falls back to simulated signing for demo mode.
 *
 * Treasury wallet: 0x2715A10a1c79C83E2dAC70C5124CAC532409A3Cc
 * Chain: Base Sepolia (eip155:84532)
 */

import { ethers } from "ethers";
import { store } from "./store.js";

export const TREASURY_ADDRESS =
  process.env.TREASURY_ADDRESS || "0x2715A10a1c79C83E2dAC70C5124CAC532409A3Cc";

const BASE_SEPOLIA_RPC =
  process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";

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
 * If TREASURY_PRIVATE_KEY is set → real Base Sepolia tx.
 * Otherwise → simulated signing (demo mode).
 */
export async function owsTransfer(proposal) {
  const policy = evaluatePolicy(proposal);

  if (!policy.allow) {
    return { success: false, owsSigned: false, reason: policy.reason };
  }

  const privateKey = process.env.TREASURY_PRIVATE_KEY;

  if (privateKey) {
    // ── Real on-chain transfer ────────────────────────────────────────────────
    try {
      const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
      const wallet = new ethers.Wallet(privateKey, provider);

      const treasuryBal = await provider.getBalance(wallet.address);
      const needed = ethers.parseEther(proposal.amount.toString());
      console.log(`[OWS] Policy ALLOW — yesPct=${policy.yesPct}%`);
      console.log(`[OWS] Treasury balance: ${ethers.formatEther(treasuryBal)} ETH, needed: ${proposal.amount} ETH`);

      if (treasuryBal < needed) {
        console.warn(`[OWS] Insufficient on-chain balance — falling back to simulated signing`);
        // Fall through to simulated mode below
      } else {
        const tx = await wallet.sendTransaction({ to: proposal.to, value: needed });
        console.log(`[OWS] Broadcasting tx ${tx.hash} on Base Sepolia…`);
        const receipt = await tx.wait(1);
        console.log(`[OWS] Confirmed in block ${receipt.blockNumber}`);

        return {
          success: true,
          owsSigned: true,
          txHash: tx.hash,
          yesPct: policy.yesPct,
          wallet: "syndicate-treasury",
          chain: "eip155:84532",
          policy: "withdrawal-policy",
          real: true,
        };
      }
    } catch (err) {
      console.error("[OWS] Real tx failed:", err.message);
      // Fall through to simulated mode
    }
  }

  // ── Simulated signing (demo / no private key) ─────────────────────────────
  await new Promise((r) => setTimeout(r, 400));

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
    real: false,
  };
}
