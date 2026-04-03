// In-memory data store for hackathon demo
export const store = {
  members: {},      // address -> Member
  proposals: {},    // id -> Proposal
  history: [],      // ActivityEvent[]
  totalBalance: 0,
};

const DEMO_SEED = [
  { address: "0xAlice", name: "Alice", deposit: 1.0 },
  { address: "0xBob",   name: "Bob",   deposit: 1.0 },
  { address: "0xCarol", name: "Carol", deposit: 1.0 },
];

// Seed some demo members so the UI isn't empty
export function seedDemo() {
  DEMO_SEED.forEach(({ address, name, deposit }) => {
    store.members[address] = {
      address,
      name,
      deposited: deposit,
      withdrawn: 0,
      balance: deposit,
      votingPower: 0,
    };
  });
  recalcVotingPower();
}

export function resetStore() {
  store.members   = {};
  store.proposals = {};
  store.history   = [];
  store.totalBalance = 0;
  seedDemo();
}

export function recalcVotingPower() {
  const total = Object.values(store.members).reduce((s, m) => s + m.balance, 0);
  store.totalBalance = total;
  for (const m of Object.values(store.members)) {
    m.votingPower = total > 0 ? (m.balance / total) * 100 : 0;
  }
}

export function checkAndReject(proposal) {
  if (proposal.status !== "active") return false;

  recalcVotingPower();
  const allMembers = Object.values(store.members);
  const votedAddresses = new Set(proposal.votes.map((v) => v.member));
  const allVoted = allMembers.every((m) => votedAddresses.has(m.address));
  if (!allVoted) return false;

  const yesPower = proposal.votes
    .filter((v) => v.vote === "yes")
    .reduce((s, v) => s + (store.members[v.member]?.balance ?? 0), 0);
  const pct = store.totalBalance > 0 ? (yesPower / store.totalBalance) * 100 : 0;

  if (pct < 51) {
    proposal.status = "rejected";
    proposal.rejectedAt = new Date().toISOString();
    addEvent("rejected", {
      proposalId: proposal.id,
      amount: proposal.amount,
      to: proposal.to,
      yesPct: pct.toFixed(1),
    });
    return true;
  }
  return false;
}

export function addEvent(type, data) {
  store.history.unshift({
    id: Date.now().toString(),
    type,
    ...data,
    timestamp: new Date().toISOString(),
  });
}
