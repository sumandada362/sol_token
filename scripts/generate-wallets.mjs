#!/usr/bin/env node
/**
 * Test-wallet generator — creates wallets with mnemonic phrases, private keys,
 * optionally airdrops SOL, and writes both a machine-readable JSON and a
 * human-readable import guide (.txt) for Phantom / Solflare / Backpack.
 * The network (devnet/testnet) is inferred from --rpc.
 *
 * Usage:
 *   node scripts/generate-wallets.mjs [options]
 *
 * Options:
 *   --count   N     Wallets to generate              (default: 5)
 *   --words   12|24 Mnemonic length                  (default: 24)
 *   --sol     N     SOL to airdrop per wallet         (default: 2)
 *   --out     FILE  Base output path without extension (default: scripts/<network>-wallets)
 *   --append        Add to existing file instead of overwriting
 *   --rpc     URL   RPC URL (default: devnet)
 *   --no-airdrop    Skip airdrop, generate keypairs only
 *   --help          Show this message
 */

// Static imports — none of these use fetch, so order doesn't matter here.
import * as bip39 from "bip39";
import { createRequire } from "module";
import bs58 from "bs58";
import https from "https";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const require        = createRequire(import.meta.url);
const { derivePath } = require("ed25519-hd-key");
const __dirname      = dirname(fileURLToPath(import.meta.url));

// Patch globalThis.fetch BEFORE @solana/web3.js is imported.
// web3.js v1.98 captures `fetchImpl = globalThis.fetch` at module-init time,
// so the static import must come AFTER this polyfill runs.
// Node 22 on Windows fails with UNABLE_TO_VERIFY_LEAF_SIGNATURE on public
// Solana RPCs — bypassing TLS is safe here since this never touches mainnet funds.
const _nf    = require("node-fetch");
const _agent = new https.Agent({ rejectUnauthorized: false });
const _fetch = (url, opts = {}) => _nf(url, { ...opts, agent: _agent });
globalThis.fetch    = _fetch;
globalThis.Headers  = _nf.Headers;
globalThis.Request  = _nf.Request;
globalThis.Response = _nf.Response;

// Dynamic import ensures web3.js module code runs AFTER the polyfill above.
const { Keypair, Connection, LAMPORTS_PER_SOL } = await import("@solana/web3.js");

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
  node scripts/generate-wallets.mjs [options]

  --count   N       Wallets to create  (default: 5)
  --words   12|24   Mnemonic length    (default: 24)
  --sol     N       SOL to airdrop each (default: 2)
  --out     FILE    Base output name   (default: scripts/<network>-wallets)
  --append          Add to existing files
  --rpc     URL     RPC endpoint (default: devnet)
  --no-airdrop      Skip airdrop
  --help            Show this help
`);
  process.exit(0);
}

const COUNT      = Math.max(1, parseInt(argVal("--count",  "5"), 10));
const WORDS      = parseInt(argVal("--words", "24"), 10) === 12 ? 128 : 256; // bip39 entropy bits
const SOL_EACH   = Math.max(0, parseFloat(argVal("--sol", "2")));
const APPEND     = has("--append");
const RPC_URL    = argVal("--rpc", "https://api.devnet.solana.com");
const NO_AIRDROP = has("--no-airdrop");

// Network label inferred from the RPC URL — drives the default output paths,
// the JSON `network` field, and the warnings in the .txt guide.
const NETWORK = RPC_URL.includes("testnet") ? "testnet"
  : RPC_URL.includes("mainnet") ? "mainnet-beta"
  : "devnet";
const NETNAME = NETWORK === "mainnet-beta" ? "Mainnet" : NETWORK[0].toUpperCase() + NETWORK.slice(1);

const OUT_BASE   = argVal("--out", join(__dirname, `${NETWORK}-wallets`));
const OUT_JSON   = OUT_BASE.endsWith(".json") ? OUT_BASE : `${OUT_BASE}.json`;
const OUT_TXT    = OUT_BASE.replace(/\.json$/, "") + ".txt";
const MAX_SOL_REQ = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function deriveKeypair(mnemonic, accountIndex = 0) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const path = `m/44'/501'/${accountIndex}'/0'`;
  const { key } = derivePath(path, seed.toString("hex"));
  return { keypair: Keypair.fromSeed(key), path };
}

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

async function airdropTotal(connection, publicKey, totalSol) {
  let remaining = totalSol;
  let sent = 0;
  while (remaining > 0.000001) {
    const batch    = Math.min(remaining, MAX_SOL_REQ);
    const lamports = Math.round(batch * LAMPORTS_PER_SOL);
    await airdropWithRetry(connection, publicKey, lamports);
    sent      += batch;
    remaining  = parseFloat((remaining - batch).toFixed(9));
    if (remaining > 0) await sleep(1500);
  }
  return sent;
}

// ---------------------------------------------------------------------------
// Text file builder
// ---------------------------------------------------------------------------

function buildTxt(wallets, isAppend, existingCount) {
  const divider  = "=".repeat(72);
  const separator = "─".repeat(72);
  const thin     = " ".repeat(2);

  let out = "";

  if (!isAppend || existingCount === 0) {
    out += `${divider}\n`;
    out += ` FORGE ${NETWORK.toUpperCase()} WALLETS — IMPORT GUIDE\n`;
    out += ` Generated : ${new Date().toISOString()}\n`;
    out += ` Network   : ${NETWORK.toUpperCase()}  ⚠  Never import these on mainnet\n`;
    out += `${divider}\n\n`;
  } else {
    out += `\n${"─".repeat(72)}\n`;
    out += ` Appended: ${new Date().toISOString()}\n`;
    out += `${"─".repeat(72)}\n\n`;
  }

  wallets.forEach((w, i) => {
    const num = existingCount + i + 1;
    const wordList = w.mnemonic.split(" ");
    const rows = [];
    for (let r = 0; r < wordList.length; r += 6) {
      const chunk = wordList.slice(r, r + 6);
      rows.push(chunk.map((word, idx) => `${String(r + idx + 1).padStart(2)}. ${word.padEnd(12)}`).join("  "));
    }

    out += `${"━".repeat(72)}\n`;
    out += ` WALLET ${num} — ${w.label}\n`;
    out += `${"━".repeat(72)}\n\n`;
    out += `${thin}Address      :  ${w.publicKey}\n`;
    out += `${thin}Balance      :  ${w.balance.toFixed(4)} SOL (${NETWORK})\n`;
    out += `${thin}Derivation   :  ${w.derivationPath}\n`;
    out += `${thin}Created      :  ${w.createdAt}\n\n`;

    out += `${thin}SEED PHRASE (${wordList.length} words)\n`;
    out += `${thin}${separator.slice(0, 50)}\n`;
    rows.forEach((r) => { out += `${thin}  ${r}\n`; });

    out += `\n${thin}PRIVATE KEY — base58 (Phantom / Solflare "Import Private Key")\n`;
    out += `${thin}${separator.slice(0, 60)}\n`;
    out += `${thin}  ${w.secretKeyBase58}\n`;

    out += `\n${thin}PRIVATE KEY — JSON array (for test scripts)\n`;
    out += `${thin}${separator.slice(0, 44)}\n`;
    // Break into lines of 16 numbers each for readability
    const arr = w.secretKeyArray;
    const arrLines = [];
    for (let r = 0; r < arr.length; r += 16) {
      arrLines.push(arr.slice(r, r + 16).join(", "));
    }
    out += `${thin}  [\n`;
    arrLines.forEach((line, li) => {
      out += `${thin}    ${line}${li < arrLines.length - 1 ? "," : ""}\n`;
    });
    out += `${thin}  ]\n\n`;
  });

  // Only add the how-to section once (first write or when not appending)
  if (!isAppend || existingCount === 0) {
    out += `\n${divider}\n`;
    out += ` HOW TO IMPORT INTO WALLETS\n`;
    out += `${divider}\n\n`;

    out += ` PHANTOM\n`;
    out += ` ${"─".repeat(40)}\n`;
    out += `  Option A — Seed Phrase (recommended):\n`;
    out += `    1. Open Phantom\n`;
    out += `    2. Click the avatar icon (top right) > Add / Connect Wallet\n`;
    out += `    3. Choose "Import Secret Recovery Phrase"\n`;
    out += `    4. Enter the seed phrase words above\n`;
    out += `    5. Switch to ${NETNAME}:\n`;
    out += `       Settings (gear icon) > Developer Settings > Enable Testnet Mode\n`;
    out += `       Then pick "Solana ${NETNAME}" from the network selector\n\n`;
    out += `  Option B — Private Key:\n`;
    out += `    1. Open Phantom > Add / Connect Wallet > Import Private Key\n`;
    out += `    2. Paste the base58 private key from above\n`;
    out += `    3. Switch to ${NETNAME} (same steps as Option A step 5)\n\n`;

    out += ` SOLFLARE\n`;
    out += ` ${"─".repeat(40)}\n`;
    out += `  Option A — Seed Phrase:\n`;
    out += `    1. Open Solflare > + (add wallet) > Import via Mnemonic\n`;
    out += `    2. Paste the seed phrase\n`;
    out += `    3. Select derivation path: m/44'/501'/0'/0'\n`;
    out += `    4. Switch to ${NETNAME}: Settings > Network > ${NETNAME}\n\n`;
    out += `  Option B — Private Key:\n`;
    out += `    1. Solflare > + > Import via Private Key\n`;
    out += `    2. Paste the base58 key\n`;
    out += `    3. Switch to ${NETNAME}: Settings > Network > ${NETNAME}\n\n`;

    out += ` BACKPACK\n`;
    out += ` ${"─".repeat(40)}\n`;
    out += `  1. Open Backpack > + (top left) > Import Wallet\n`;
    out += `  2. Choose "Secret Recovery Phrase"\n`;
    out += `  3. Paste the seed phrase\n`;
    out += `  4. Switch to ${NETNAME}: Settings icon > Solana > Network > ${NETNAME}\n\n`;

    out += ` IN JAVASCRIPT TEST SCRIPTS\n`;
    out += ` ${"─".repeat(40)}\n`;
    out += `  import { Keypair } from "@solana/web3.js";\n`;
    out += `  import wallets from "./scripts/${NETWORK}-wallets.json"\n`;
    out += `                        assert { type: "json" };\n\n`;
    out += `  // Load wallet by index\n`;
    out += `  const kp = Keypair.fromSecretKey(\n`;
    out += `    Uint8Array.from(wallets[0].secretKeyArray)\n`;
    out += `  );\n\n`;
    out += `  // Or re-derive from mnemonic\n`;
    out += `  import * as bip39 from "bip39";\n`;
    out += `  import { createRequire } from "module";\n`;
    out += `  const req = createRequire(import.meta.url);\n`;
    out += `  const { derivePath } = req("ed25519-hd-key");\n`;
    out += `  const seed = bip39.mnemonicToSeedSync(wallets[0].mnemonic);\n`;
    out += `  const { key } = derivePath("m/44'/501'/0'/0'", seed.toString("hex"));\n`;
    out += `  const kp2 = Keypair.fromSeed(key);\n\n`;

    out += `\n${divider}\n`;
    out += ` ⚠  SECURITY WARNING\n`;
    out += `${divider}\n`;
    out += `  These wallets contain real private keys and seed phrases.\n`;
    out += `  - NEVER commit this file to git (already in .gitignore)\n`;
    out += `  - NEVER share or upload this file\n`;
    out += `  - ONLY use on ${NETWORK} — these have no mainnet value\n`;
    out += `  - Delete when testing is complete\n`;
    out += `${divider}\n`;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const wordCount = WORDS === 128 ? 12 : 24;
  const connection = NO_AIRDROP ? null : new Connection(RPC_URL, "confirmed");

  console.log(`\n=== Forge Wallet Generator (${NETWORK}) ===\n`);
  console.log(`  Wallets    : ${COUNT}`);
  console.log(`  Mnemonic   : ${wordCount} words (BIP39, m/44'/501'/0'/0')`);
  if (!NO_AIRDROP) {
    console.log(`  SOL each   : ${SOL_EACH}`);
    console.log(`  RPC        : ${RPC_URL}`);
  } else {
    console.log(`  Airdrop    : skipped`);
  }
  console.log(`  JSON out   : ${OUT_JSON}`);
  console.log(`  Guide out  : ${OUT_TXT}`);
  console.log(`  Mode       : ${APPEND ? "append" : "overwrite"}\n`);

  const existing = APPEND && existsSync(OUT_JSON)
    ? JSON.parse(readFileSync(OUT_JSON, "utf8"))
    : [];

  const newWallets = [];

  for (let i = 0; i < COUNT; i++) {
    const mnemonic = bip39.generateMnemonic(WORDS);
    const { keypair: kp, path } = deriveKeypair(mnemonic, 0);
    const label  = `wallet-${existing.length + i + 1}`;
    const pubkey = kp.publicKey.toBase58();

    process.stdout.write(`[${String(i + 1).padStart(String(COUNT).length)}/${COUNT}] ${label}  ${pubkey.slice(0, 16)}...  `);

    let balance    = 0;
    let airdropped = 0;

    if (!NO_AIRDROP && SOL_EACH > 0) {
      try {
        airdropped = await airdropTotal(connection, kp.publicKey, SOL_EACH);
        balance    = (await connection.getBalance(kp.publicKey)) / LAMPORTS_PER_SOL;
        process.stdout.write(`${balance.toFixed(4)} SOL\n`);
      } catch (err) {
        balance = ((await connection.getBalance(kp.publicKey).catch(() => 0))) / LAMPORTS_PER_SOL;
        process.stdout.write(`FAILED — ${(err.message ?? String(err)).slice(0, 50)} (on-chain: ${balance.toFixed(4)} SOL)\n`);
      }
    } else {
      process.stdout.write(`(no airdrop)\n`);
    }

    newWallets.push({
      label,
      publicKey:       pubkey,
      mnemonic,
      derivationPath:  path,
      secretKeyBase58: bs58.encode(kp.secretKey),
      secretKeyArray:  Array.from(kp.secretKey),
      balance,
      airdropped,
      network: NETWORK,
      createdAt: new Date().toISOString(),
    });

    if (i < COUNT - 1 && !NO_AIRDROP) await sleep(1200);
  }

  // Save JSON
  mkdirSync(dirname(OUT_JSON), { recursive: true });
  const allWallets = [...existing, ...newWallets];
  writeFileSync(OUT_JSON, JSON.stringify(allWallets, null, 2), "utf8");

  // Save / append TXT guide
  const txtContent = buildTxt(newWallets, APPEND, existing.length);
  if (APPEND && existsSync(OUT_TXT)) {
    const prev = readFileSync(OUT_TXT, "utf8");
    writeFileSync(OUT_TXT, prev + txtContent, "utf8");
  } else {
    writeFileSync(OUT_TXT, txtContent, "utf8");
  }

  // Summary table
  const LINE = "─".repeat(76);
  console.log(`\n${LINE}`);
  console.log(
    "  #  ".padEnd(6) +
    "PUBLIC KEY".padEnd(46) +
    "BALANCE".padStart(10) +
    "  AIRDROPPED"
  );
  console.log(LINE);
  newWallets.forEach((w, i) => {
    console.log(
      `  ${String(existing.length + i + 1).padEnd(3)}  ` +
      w.publicKey.padEnd(46) +
      `${w.balance.toFixed(4)} SOL`.padStart(10) +
      `  ${w.airdropped.toFixed(4)} SOL`
    );
  });
  console.log(LINE);

  const totalDropped = newWallets.reduce((s, w) => s + w.airdropped, 0);
  console.log(`\n  ${newWallets.length} wallet(s) created  |  ${totalDropped.toFixed(4)} SOL airdropped`);
  if (APPEND && existing.length > 0) {
    console.log(`  (${existing.length} existing + ${newWallets.length} new = ${allWallets.length} total)`);
  }
  console.log(`\n  JSON  →  ${OUT_JSON}`);
  console.log(`  Guide →  ${OUT_TXT}\n`);
}

main().catch((err) => {
  console.error("\nFatal:", err?.message ?? err);
  process.exit(1);
});
