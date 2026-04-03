// In-memory data store for hackathon demo
export const store = {
  members: {},      // address -> Member
  proposals: {},    // id -> Proposal
  history: [],      // ActivityEvent[]
  totalBalance: 0,
};

const DEMO_SEED = [
  { address: "0xAlice", name: "Alice", deposit: 2.0 },
  { address: "0xBob",   name: "Bob",   deposit: 2.0 },
  { address: "0xCarol", name: "Carol", deposit: 2.0 },
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

export function addEvent(type, data) {
  store.history.unshift({
    id: Date.now().toString(),
    type,
    ...data,
    timestamp: new Date().toISOString(),
  });
}
