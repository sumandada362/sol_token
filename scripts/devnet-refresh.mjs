#!/usr/bin/env node
/**
 * Devnet wallet balance refresher — reads an existing wallet JSON file,
 * checks each wallet's on-chain balance, and tops up wallets that are
 * below the minimum threshold.
 *
 * Usage:
 *   node scripts/devnet-refresh.mjs [options]
 *
 * Options:
 *   --in    FILE   Wallet JSON file to refresh  (default: scripts/devnet-wallets.json)
 *   --min   N      Top-up if balance below N SOL (default: 0.5)
 *   --top   N      Airdrop until wallet has N SOL (default: 2)
 *   --check        Only show balances, no airdrop
 *   --wallet ADDR  Refresh only this specific wallet address
 *   --rpc   URL    Devnet RPC URL
 *   --help         Show this message
 */

import { createRequire } from "module";
import https from "https";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const _req      = createRequire(import.meta.url);

// Patch globalThis.fetch BEFORE @solana/web3.js is imported.
// web3.js v1.98 captures fetchImpl = globalThis.fetch at module-init time.
// Node 22 on Windows fails TLS verification on devnet — safe to bypass here.
const _nf    = _req("node-fetch");
const _agent = new https.Agent({ rejectUnauthorized: false });
const _fetch = (url, opts = {}) => _nf(url, { ...opts, agent: _agent });
globalThis.fetch    = _fetch;
globalThis.Headers  = _nf.Headers;
globalThis.Request  = _nf.Request;
globalThis.Response = _nf.Response;

// Dynamic import ensures web3.js module code runs AFTER the polyfill above.
const { Connection, LAMPORTS_PER_SOL, PublicKey } = await import("@solana/web3.js");

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function argVal(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const has = (f) => process.argv.includes(f);

if (has("--help") || has("-h")) {
  console.log(`
  node scripts/devnet-refresh.mjs [options]

  --in    FILE   Wallet JSON file  (default: scripts/devnet-wallets.json)
  --min   N      Top-up threshold  (default: 0.5 SOL)
  --top   N      Target balance    (default: 2 SOL)
  --check        Check balances only, no airdrop
  --wallet ADDR  Only refresh this address
  --rpc   URL    Devnet RPC URL
  --help         Show this help
`);
  process.exit(0);
}

const IN_FILE    = argVal("--in",  join(__dirname, "devnet-wallets.json"));
const MIN_SOL    = parseFloat(argVal("--min", "0.5"));
const TOP_SOL    = parseFloat(argVal("--top", "2"));
const CHECK_ONLY = has("--check");
const ONLY_ADDR  = argVal("--wallet", null);
const RPC_URL    = argVal("--rpc", "https://api.devnet.solana.com");

const MAX_SOL_REQ = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function airdropWithRetry(connection, publicKey, lamports, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const sig = await connection.requestAirdrop(publicKey, lamports);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      return sig;
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = attempt * 3000;
      process.stdout.write(` [retry ${attempt}, wait ${delay / 1000}s]`);
      await sleep(delay);
    }
  }
}

async function topUp(connection, publicKey, currentSol, targetSol) {
  let needed    = parseFloat((targetSol - currentSol).toFixed(9));
  let airdropped = 0;

  while (needed > 0.000001) {
    const batch    = Math.min(needed, MAX_SOL_REQ);
    const lamports = Math.round(batch * LAMPORTS_PER_SOL);
    await airdropWithRetry(connection, publicKey, lamports);
    airdropped += batch;
    needed      = parseFloat((needed - batch).toFixed(9));
    if (needed > 0) await sleep(1500);
  }

  return airdropped;
}

function statusIcon(sol, min) {
  if (sol === 0)    return "✗";
  if (sol < min)    return "↑";
  return "✓";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(IN_FILE)) {
    console.error(`\nFile not found: ${IN_FILE}`);
    console.error(`Run "pnpm devnet:wallets" first to create wallets.\n`);
    process.exit(1);
  }

  const wallets = JSON.parse(readFileSync(IN_FILE, "utf8"));

  if (!Array.isArray(wallets) || wallets.length === 0) {
    console.error("\nNo wallets found in", IN_FILE);
    process.exit(1);
  }

  const targets = ONLY_ADDR
    ? wallets.filter((w) => w.publicKey === ONLY_ADDR)
    : wallets;

  if (ONLY_ADDR && targets.length === 0) {
    console.error(`\nWallet ${ONLY_ADDR} not found in ${IN_FILE}`);
    process.exit(1);
  }

  const connection = new Connection(RPC_URL, "confirmed");

  console.log("\n=== Forge Devnet Balance Refresher ===\n");
  console.log(`  File       : ${IN_FILE}`);
  console.log(`  Wallets    : ${targets.length}${ONLY_ADDR ? " (filtered)" : ""}`);
  if (!CHECK_ONLY) {
    console.log(`  Top-up if  : balance < ${MIN_SOL} SOL`);
    console.log(`  Top up to  : ${TOP_SOL} SOL`);
  } else {
    console.log(`  Mode       : check only (no airdrop)`);
  }
  console.log(`  RPC        : ${RPC_URL}\n`);

  // Fetch all balances in parallel first
  process.stdout.write("Fetching balances");
  const balances = await Promise.all(
    targets.map((w) =>
      connection
        .getBalance(new PublicKey(w.publicKey))
        .then((b) => b / LAMPORTS_PER_SOL)
        .catch(() => null)
    )
  );
  console.log(" done\n");

  const LINE = "─".repeat(78);
  console.log(LINE);
  console.log(
    " " +
    "".padEnd(3) +
    "LABEL".padEnd(12) +
    "PUBLIC KEY".padEnd(46) +
    "BALANCE".padStart(10) +
    "  ACTION"
  );
  console.log(LINE);

  let totalAirdropped = 0;
  let toppedUp        = 0;
  let skipped         = 0;
  let errors          = 0;

  for (let i = 0; i < targets.length; i++) {
    const w      = targets[i];
    const before = balances[i];
    const icon   = before === null ? "?" : statusIcon(before, MIN_SOL);
    const pubShort = w.publicKey.slice(0, 16) + "..." + w.publicKey.slice(-4);

    process.stdout.write(
      ` ${icon}  ${(w.label ?? "").padEnd(11)} ${w.publicKey.padEnd(46)} ${
        before === null ? "      ?" : `${before.toFixed(4)} SOL`
      }  `
    );

    // When --min 0, treat --top as the trigger (top up anything below target).
    // Otherwise, top up only if below the --min threshold.
    const trigger = MIN_SOL > 0 ? MIN_SOL : TOP_SOL;
    const alreadyOk = before !== null && before >= trigger;

    if (CHECK_ONLY || before === null || alreadyOk) {
      const reason = CHECK_ONLY ? "check-only" : before === null ? "fetch error" : "ok";
      process.stdout.write(`${reason}\n`);
      if (alreadyOk) skipped++;
      if (before === null) errors++;

      // Update stored balance in the JSON if changed
      const idx = wallets.findIndex((x) => x.publicKey === w.publicKey);
      if (idx !== -1 && before !== null) wallets[idx].balance = before;
      continue;
    }

    // Needs top-up
    try {
      const added  = await topUp(connection, new PublicKey(w.publicKey), before, TOP_SOL);
      const after  = (await connection.getBalance(new PublicKey(w.publicKey))) / LAMPORTS_PER_SOL;

      totalAirdropped += added;
      toppedUp++;

      process.stdout.write(`+${added.toFixed(4)} SOL → ${after.toFixed(4)} SOL\n`);

      // Update stored balance
      const idx = wallets.findIndex((x) => x.publicKey === w.publicKey);
      if (idx !== -1) {
        wallets[idx].balance    = after;
        wallets[idx].airdropped = (wallets[idx].airdropped ?? 0) + added;
      }
    } catch (err) {
      errors++;
      process.stdout.write(`FAILED — ${(err.message ?? String(err)).slice(0, 40)}\n`);
    }

    if (i < targets.length - 1) await sleep(1200);
  }

  console.log(LINE);
  console.log(`\n  Checked    : ${targets.length}`);
  console.log(`  Topped up  : ${toppedUp}`);
  console.log(`  Already ok : ${skipped}`);
  if (errors > 0) console.log(`  Errors     : ${errors}`);
  if (!CHECK_ONLY) console.log(`  Airdropped : ${totalAirdropped.toFixed(4)} SOL total`);

  // Save updated balances to JSON
  writeFileSync(IN_FILE, JSON.stringify(wallets, null, 2), "utf8");
  console.log(`\n  Balances saved → ${IN_FILE}\n`);
}

main().catch((err) => {
  console.error("\nFatal:", err?.message ?? err);
  process.exit(1);
});
