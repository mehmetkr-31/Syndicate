/**
 * Internal API used by agents to trigger OWS execution check
 * without going through HTTP — avoids circular dependency with routes/pool.js.
 */

import { store, recalcVotingPower, addEvent, checkAndReject } from "../lib/store.js";
import { owsTransfer } from "../lib/ows.js";

const executing = new Set();

export const api = {
  async checkAndExecute(proposal) {
    if (proposal.status !== "active") return;
    if (executing.has(proposal.id)) return;
    executing.add(proposal.id);

    try {
    recalcVotingPower();
    const result = await owsTransfer(proposal);

    if (!result.success) {
      checkAndReject(proposal);
      return;
    }

    if (result.success) {
      proposal.status = "executed";
      proposal.txHash = result.txHash;
      proposal.executedAt = new Date().toISOString();
      proposal.owsSigned = true;

      const prevTotal = store.totalBalance + proposal.amount;
      const ratio = prevTotal > 0 ? proposal.amount / prevTotal : 0;
      for (const m of Object.values(store.members)) {
        const cut = m.balance * ratio;
        m.withdrawn += cut;
        m.balance   -= cut;
      }
      store.totalBalance -= proposal.amount;
      recalcVotingPower();

      addEvent("execute", {
        proposalId: proposal.id,
        amount: proposal.amount,
        to: proposal.to,
        txHash: result.txHash,
        owsSigned: true,
        yesPct: result.yesPct,
        triggeredByAgent: true,
      });
    }
    } finally {
      executing.delete(proposal.id);
    }
  },
};
