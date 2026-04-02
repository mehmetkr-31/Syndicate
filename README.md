# Syndicate
> Weighted Multisig Treasury — powered by OWS

## What is it?
A shared treasury where voting power = ETH balance.  
No one can move funds alone. OWS signs every transfer.

## The Problem
Group funds always need a trusted third party — a bank, a lawyer, a platform.  
That third party can fail, flee, or be hacked.

## The Solution
Syndicate replaces the third party with OWS policy enforcement.
- Members deposit ETH → voting power assigned proportionally
- Anyone proposes a withdrawal
- OWS `withdrawal-policy` blocks execution until ≥51% voting power approves
- When threshold is met → OWS signs and executes automatically
- No human intermediary. No trusted coordinator.

## How OWS is used
- `ows wallet create --name syndicate-treasury` — shared vault
- `ows key create --name syndicate-agent --policy withdrawal-policy` — agent token
- Custom executable policy checks cumulative YES voting power before any key is touched
- Private key never exposed to the application

## MoonPay Integration
- `moonpay-deposit` skill — fund the treasury from any chain via MoonPay
- Members can on-ramp fiat → ETH directly into the shared pool

## Stack
- OWS (Open Wallet Standard) — signing and policy enforcement
- MoonPay CLI — deposit skill
- Node.js + Express — backend
- React + Vite — frontend
- Base Sepolia — EVM testnet

## Track
Track 4 — The Commons: Group coordination & shared capital

## Demo flow
1. Alice, Bob, Carol each deposit ETH → voting power assigned
2. Alice proposes: send 0.5 ETH to 0x...
3. Bob votes YES (31%) → insufficient, OWS blocks
4. Carol votes YES (52%) → threshold met, OWS executes
5. txHash returned, activity log updated

## Run locally
```bash
npm install -g @open-wallet-standard/core
ows wallet create --name syndicate-treasury
npm i -g @moonpay/cli && mp auth login
PORT=3010 ./start.sh
```
