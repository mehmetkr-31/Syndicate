// In-memory data store for hackathon demo
export const store = {
  members: {},      // address -> Member
  proposals: {},    // id -> Proposal
  history: [],      // ActivityEvent[]
  totalBalance: 0,
};

// Seed some demo members so the UI isn't empty
export function seedDemo() {
  const seed = [
    { address: "0xAlice", name: "Alice" },
    { address: "0xBob",   name: "Bob"   },
    { address: "0xCarol", name: "Carol" },
  ];
  seed.forEach(({ address, name }) => {
    store.members[address] = {
      address,
      name,
      deposited: 0,
      withdrawn: 0,
      balance: 0,
      votingPower: 0,
    };
  });
}

export function recalcVotingPower() {
  const total = Object.values(store.members).reduce((s, m) => s + m.balance, 0);
  store.totalBalance = total;
  for (const m of Object.values(store.members)) {
    m.votingPower = total > 0 ? (m.balance / total) * 100 : 0;
  }
}

export function addEvent(type, data) {
  store.history.unshift({
    id: Date.now().toString(),
    type,
    ...data,
    timestamp: new Date().toISOString(),
  });
}
