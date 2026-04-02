#!/usr/bin/env node
/**
 * OWS Custom Executable Policy: withdrawal-policy
 *
 * Register with:
 *   ows policy create withdrawal-policy --exec ./policies/withdrawal-policy.js
 *   ows key create --name syndicate-agent --wallet syndicate-treasury --policy withdrawal-policy
 *
 * OWS invokes this script for every signing request made with the syndicate-agent key.
 * It passes a PolicyContext JSON blob via stdin and expects a PolicyResult on stdout.
 *
 * PolicyContext shape:
 * {
 *   request: { to, value, chainId, data? },
 *   metadata: { proposalId, votes: [{member, vote, balance}], totalBalance }
 * }
 *
 * PolicyResult shape:
 * { allow: boolean, reason?: string }
 */

import { createInterface } from "readline";

async function main() {
  let raw = "";
  const rl = createInterface({ input: process.stdin });
  for await (const line of rl) raw += line;

  let ctx;
  try {
    ctx = JSON.parse(raw);
  } catch {
    console.log(JSON.stringify({ allow: false, reason: "Invalid policy context" }));
    process.exit(1);
  }

  const { metadata } = ctx;
  if (!metadata) {
    console.log(JSON.stringify({ allow: false, reason: "Missing metadata in policy context" }));
    process.exit(1);
  }

  const { votes = [], totalBalance = 0 } = metadata;

  if (totalBalance <= 0) {
    console.log(JSON.stringify({ allow: false, reason: "Treasury is empty" }));
    process.exit(0);
  }

  const yesPower = votes
    .filter((v) => v.vote === "yes")
    .reduce((sum, v) => sum + (v.balance || 0), 0);

  const yesPct = (yesPower / totalBalance) * 100;

  if (yesPct >= 51) {
    console.log(JSON.stringify({ allow: true, yesPct }));
  } else {
    console.log(
      JSON.stringify({
        allow: false,
        reason: `Voting threshold not met: ${yesPct.toFixed(1)}% YES votes (51% required)`,
      })
    );
  }
}

main().catch((err) => {
  console.log(JSON.stringify({ allow: false, reason: err.message }));
  process.exit(1);
});
