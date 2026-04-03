# ⬡ Syndicate — Autonomous AI Agent Treasury

> The first OWS-native treasury governed by a council of debating AI agents.

**OWS Hackathon 2026 · Track 4 — Multi-Agent Systems & Autonomous Economies**

## What is Syndicate?

Syndicate is a shared treasury where no single human or agent controls the funds. When a withdrawal is proposed, a council of 4 specialized AI agents automatically deliberate and vote. OWS policy blocks execution until consensus is reached. Private keys never leave the local machine.

**No trusted third party. No exposed keys. No single point of control.**

## How It Works

Human proposes withdrawal → Agent Council convenes → VetoAgent checks blacklist → ConservativeAgent checks risk → RiskAgent checks growth → NeutralAgent checks balance → OWS policy evaluates cumulative YES voting power → < 51% BLOCKED / ≥ 51% OWS signs & executes on-chain

## Agent Council

| Agent | Role | Strategy | OWS Key |
|-------|------|----------|---------|
| 🚫 VetoAgent | Security Auditor | Blacklist enforcement — instant REJECT | `veto-agent` |
| 🛡️ ConservativeAgent | Financial Advisor | Blocks if amount > 20% of treasury | `conservative-agent` |
| 🔥 RiskAgent | Growth Investor | Always bullish | `risk-agent` |
| 📊 NeutralAgent | Balanced Analyst | Blocks if amount > 50% of treasury | `neutral-agent` |

Voting power = proportional to ETH balance.

## OWS Integration

```bash
ows wallet create --name syndicate-treasury
ows key create --name veto-agent --wallet syndicate-treasury --policy withdrawal-policy
ows key create --name conservative-agent --wallet syndicate-treasury --policy withdrawal-policy
ows key create --name risk-agent --wallet syndicate-treasury --policy withdrawal-policy
ows key create --name neutral-agent --wallet syndicate-treasury --policy withdrawal-policy
```

Custom executable policy checks cumulative YES voting power before any key is touched. Private keys never exposed to the application layer.

## MoonPay Integration

`moonpay-deposit` skill integrated — fund the treasury from any chain via MoonPay CLI.

## Live On-Chain

Real Base Sepolia tx: `0xca880cd4e8239e91aecb537654d49b7b67f14af68c762b5df6a86562986312b9`

## Demo Scenarios

- **Happy Path:** Propose 0.3 ETH → agents deliberate → 70% YES → OWS executes
- **Veto Path:** Propose to `0xHacker` → VetoAgent instant REJECT
- **Risk Block:** Propose > 20% treasury → Conservative + Neutral NO → BLOCKED

## Stack

- OWS (Open Wallet Standard) — signing and policy enforcement
- MoonPay CLI — deposit skill
- Node.js + Express — backend
- React + Vite + Tailwind — frontend
- Base Sepolia — EVM testnet

## Run Locally

```bash
npm install -g @open-wallet-standard/core
ows wallet create --name syndicate-treasury
npm i -g @moonpay/cli && mp auth login
TREASURY_ADDRESS=0x... PORT=3010 ./start.sh
```

## Track

Multi-Agent Systems & Autonomous Economies — OWS Hackathon · April 3, 2026
