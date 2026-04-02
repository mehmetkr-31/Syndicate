# Syndicate

**Weighted Multisig Treasury** — a shared ETH pool where voting power equals your stake.

Built with **OWS (Open Wallet Standard)** + **MoonPay CLI** for the hackathon.

---

## What it does

- Members deposit ETH into a shared treasury
- Voting power = your balance / total balance × 100%
- Any withdrawal requires a proposal + vote
- OWS `withdrawal-policy` blocks execution until **≥51% voting power** approves
- MoonPay deposit links let anyone fund the treasury from any chain

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Wallet / Signing | OWS (Open Wallet Standard) |
| Fiat / Cross-chain | MoonPay CLI (`@moonpay/cli`) |
| Chain | Base Sepolia (`eip155:84532`) |

## Quick Start

```bash
# Install dependencies
cd backend  && npm install
cd ../frontend && npm install

# Start both servers (backend :3010, frontend :5173)
cd ..
PORT=3010 ./start.sh
```

Open http://localhost:5173

## OWS Setup (production)

```bash
# Create treasury wallet
ows wallet create --name syndicate-treasury

# Register the withdrawal policy
ows policy create withdrawal-policy \
  --exec ./backend/policies/withdrawal-policy.js

# Create API key gated by the policy
ows key create \
  --name syndicate-agent \
  --wallet syndicate-treasury \
  --policy withdrawal-policy

# Set real treasury address
TREASURY_ADDRESS=0x... PORT=3010 ./start.sh
```

## MoonPay Setup (production)

```bash
mp auth login
# Then "Fund with MoonPay" button in the UI works end-to-end
```

## OWS Policy

`backend/policies/withdrawal-policy.js` is a standalone executable that OWS invokes for every signing request:

1. Reads `PolicyContext` from stdin (votes, balances, proposal)
2. Tallies YES voting power as % of total treasury balance
3. Returns `{ allow: true }` if ≥51%, otherwise `{ allow: false, reason: "..." }`

This means **no code path can bypass the vote** — the wallet itself refuses to sign.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pool/state` | Balances, voting powers, proposals |
| `GET` | `/pool/history` | Full activity log |
| `POST` | `/pool/deposit` | Record a deposit |
| `POST` | `/pool/propose` | Create a withdrawal proposal |
| `POST` | `/pool/vote` | Cast a weighted vote |
| `POST` | `/pool/deposit/moonpay` | Generate MoonPay deposit link |

## Data Model

```
Member   { address, name, deposited, withdrawn, balance, votingPower }
Proposal { id, proposer, to, amount, status, votes[], createdAt, txHash? }
```

## Demo Flow

1. Alice deposits 3 ETH → 60% voting power
2. Bob deposits 2 ETH → 40% voting power
3. Bob proposes sending 1 ETH to `0xRecipient`
4. Alice votes YES (60% ≥ 51%) → OWS policy approves → transfer executed
5. UI shows **"Signed by OWS ✓"** with tx hash, chain, wallet, policy
