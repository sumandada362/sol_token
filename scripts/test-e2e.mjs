#!/usr/bin/env node
/**
 * End-to-end feature test — exercises every Solana Token feature through the real
 * HTTP API with real signed transactions, on whichever cluster .env.local's
 * SOLANA_RPC_URL points at (devnet or testnet).
 *
 *   node scripts/test-e2e.mjs
 *
 * Uses wallet-1 from scripts/<network>-wallets.json as the payer
 * (override with E2E_WALLETS_FILE).
 * Writes results to scripts/<network>-e2e-results.json for the audit report.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import https from "https";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Windows/Node TLS workaround for public Solana RPCs (same as generate-wallets.mjs) —
// patch fetch BEFORE web3.js captures it. localhost keeps the native fetch
// (undici) so FormData/Blob bodies work; only external HTTPS gets node-fetch
// with TLS verification relaxed.
const nativeFetch = globalThis.fetch;
const _nf = require("node-fetch");
const _agent = new https.Agent({ rejectUnauthorized: false });
globalThis.fetch = (url, opts = {}) =>
  String(url).startsWith("http://localhost")
    ? nativeFetch(url, opts)
    : _nf(url, { ...opts, agent: _agent });

const { Connection, Keypair, Transaction, PublicKey, LAMPORTS_PER_SOL } = await import("@solana/web3.js");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

// ── env / wallets ───────────────────────────────────────────────────────────
function readEnv(key) {
  const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim() : null;
}
const RPC_URL = readEnv("SOLANA_RPC_URL") ?? "https://api.devnet.solana.com";
const FEE_WALLET = readEnv("FEE_WALLET_ADDRESS");
const NETWORK = RPC_URL.includes("testnet") ? "testnet" : "devnet";

// Wallet file: E2E_WALLETS_FILE env wins; otherwise pick the file matching the
// cluster in SOLANA_RPC_URL, falling back to whichever of the two exists.
const walletsFile =
  process.env.E2E_WALLETS_FILE ??
  [
    join(__dirname, `${NETWORK}-wallets.json`),
    join(__dirname, `${NETWORK === "testnet" ? "devnet" : "testnet"}-wallets.json`),
  ].find(existsSync);
if (!walletsFile) {
  console.error("No wallet file found — run scripts/generate-wallets.mjs first.");
  process.exit(1);
}
const wallets = JSON.parse(readFileSync(walletsFile, "utf8"));
const payerKp = Keypair.fromSecretKey(Uint8Array.from(wallets[0].secretKeyArray));
const payer = payerKp.publicKey.toBase58();
const recipient1 = wallets[2].publicKey; // wallet-3 — fresh, tests ATA creation
const recipient2 = wallets[3].publicKey;
const recipient3 = wallets[4].publicKey;

const conn = new Connection(RPC_URL, "confirmed");

// ── helpers ─────────────────────────────────────────────────────────────────
const results = [];
let createdMints = {};

function log(s) { process.stdout.write(s); }

async function step(name, fn) {
  log(`  • ${name} ... `);
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ name, pass: true, ms: Date.now() - t0, detail: detail ?? "" });
    log(`PASS (${((Date.now() - t0) / 1000).toFixed(1)}s)${detail ? " — " + detail : ""}\n`);
  } catch (err) {
    results.push({ name, pass: false, ms: Date.now() - t0, detail: String(err.message ?? err) });
    log(`FAIL — ${String(err.message ?? err).slice(0, 140)}\n`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

/**
 * API helper with 429 pacing. The per-wallet/IP rate limits are production
 * anti-abuse controls; this suite legitimately runs faster than a human, so
 * on 429 it waits out the window (Retry-After) and retries instead of
 * failing the step — production limits stay strict, the test paces itself.
 */
async function api(path, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(opts.headers ?? {}) },
      ...opts,
    });
    if (res.status === 429 && attempt < 3) {
      const wait = Math.min(Number(res.headers.get("retry-after")) || 15, 90);
      log(`[429 — pacing ${wait}s] `);
      await new Promise((r) => setTimeout(r, wait * 1000 + 1500));
      continue;
    }
    let json = null;
    try { json = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, json, headers: res.headers };
  }
}

/**
 * HTTP-polling confirmation — confirmTransaction needs a WebSocket, which the
 * TLS-intercepting environments this script targets can't open.
 */
async function waitForConfirmation(sig, lastValidBlockHeight) {
  for (;;) {
    const st = await conn.getSignatureStatus(sig, { searchTransactionHistory: true });
    const v = st.value;
    if (v) {
      if (v.err) throw new Error(`tx failed on-chain: ${JSON.stringify(v.err)}`);
      if (v.confirmationStatus === "confirmed" || v.confirmationStatus === "finalized") return;
    }
    const bh = await conn.getBlockHeight("confirmed");
    if (bh > lastValidBlockHeight) throw new Error("block height exceeded before confirmation");
    await new Promise((r) => setTimeout(r, 2000));
  }
}

/** Sign a base64 tx from the API (payer + optional extra keypairs), submit, confirm. */
async function signAndSend(base64Tx, lastValidBlockHeight, extraSigners = []) {
  const tx = Transaction.from(Buffer.from(base64Tx, "base64"));
  for (const kp of extraSigners) tx.partialSign(kp);
  tx.partialSign(payerKp);
  const sig = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
  await waitForConfirmation(sig, lastValidBlockHeight);
  return sig;
}

/**
 * check-authority with a short 404 retry: public RPC load balancers can route
 * the server's read to a node a slot behind the one that confirmed our tx.
 */
async function checkAuthority(mint, retries = 4) {
  for (let i = 0; ; i++) {
    const r = await api(`/api/check-authority?mint=${mint}`);
    if (r.status !== 404 || i >= retries) return r;
    await new Promise((res) => setTimeout(res, 3000));
  }
}

async function confirmAction(signature, action, extra = {}) {
  const r = await api("/api/confirm", {
    method: "POST",
    body: JSON.stringify({ signature, action, wallet: payer, ...extra }),
  });
  assert(r.status === 200 && r.json?.ok === true, `confirm ${action} → ${r.status} ${JSON.stringify(r.json)}`);
  return r.json;
}

// Tiny valid 1x1 transparent PNG
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

// ── test run ────────────────────────────────────────────────────────────────
console.log(`\nSolana Token ${NETWORK} E2E — ${BASE}`);
console.log(`payer: ${payer}`);
console.log(`rpc:   ${RPC_URL.replace(/api-key=.*/, "api-key=***")}\n`);

const startBal = await conn.getBalance(payerKp.publicKey) / LAMPORTS_PER_SOL;
const feeWalletStart = FEE_WALLET ? await conn.getBalance(new PublicKey(FEE_WALLET)) / LAMPORTS_PER_SOL : 0;
console.log(`payer balance: ${startBal.toFixed(4)} SOL | fee wallet: ${feeWalletStart.toFixed(4)} SOL\n`);

let metadataUri = "";

// ════ 1. IPFS upload ════
console.log("── Upload / IPFS ──");
await step("POST /api/upload — PNG + metadata to Pinata", async () => {
  const form = new FormData();
  const blob = new Blob([PNG_1PX], { type: "image/png" });
  form.append("file", blob, "logo.png");
  form.append("name", "Solana Token Test Alpha");
  form.append("symbol", "FTA");
  form.append("description", "E2E test token - spaces and-hyphens preserved");
  form.append("website", "https://example.com");
  const res = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
  const json = await res.json();
  assert(res.status === 200, `upload → ${res.status} ${JSON.stringify(json)}`);
  assert(json.metadataUri?.startsWith("https://"), "no metadataUri returned");
  metadataUri = json.metadataUri;
  return json.metadataUri;
});

await step("Metadata JSON preserves spaces in name", async () => {
  if (!metadataUri) throw new Error("skipped — no metadataUri");
  // Fresh pins propagate to public gateways slowly — try several with retries
  const cid = metadataUri.split("/ipfs/")[1];
  const gateways = [metadataUri, `https://gateway.pinata.cloud/ipfs/${cid}`, `https://dweb.link/ipfs/${cid}`];
  let json = null;
  for (let attempt = 0; attempt < 6 && !json; attempt++) {
    for (const url of gateways) {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) { json = await res.json(); break; }
      } catch { /* try next gateway */ }
    }
    if (!json) await new Promise((r) => setTimeout(r, 5000));
  }
  assert(json, "metadata JSON unreachable on all gateways");
  assert(json.name === "Solana Token Test Alpha", `name corrupted: "${json.name}"`);
  assert(json.description?.includes("spaces and-hyphens"), `description corrupted: "${json.description}"`);
  return `name="${json.name}"`;
});

// ════ 2. Create token A — classic SPL with metadata ════
console.log("\n── Token A: classic SPL ──");
const mintA = Keypair.generate();
createdMints.A = mintA.publicKey.toBase58();

await step("POST /api/tx/create-token (SPL) → sign → on-chain", async () => {
  const r = await api("/api/tx/create-token", {
    method: "POST",
    body: JSON.stringify({
      payer, mintPublicKey: mintA.publicKey.toBase58(),
      name: "Solana Token Test Alpha", symbol: "FTA",
      supply: "1000000", decimals: 6,
      metadataUri, standard: "spl",
      revokeMint: false, revokeFreeze: false, revokeUpdate: false, customCreator: false,
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight, [mintA]);
  createdMints.A_sig = sig;
  return sig.slice(0, 16) + "…";
});

await step("POST /api/confirm createToken (fee verified server-side)", async () => {
  const j = await confirmAction(createdMints.A_sig, "createToken", {
    mint: createdMints.A, name: "Solana Token Test Alpha", symbol: "FTA", metadataUri, standard: "spl",
  });
  return `recorded=${j.recorded}`;
});

await step("GET /api/check-authority — name, symbol, authorities", async () => {
  const r = await checkAuthority(createdMints.A);
  assert(r.status === 200, `→ ${r.status}`);
  assert(r.json.name === "Solana Token Test Alpha", `name="${r.json.name}"`);
  assert(r.json.mintAuthority === payer, "mintAuthority mismatch");
  assert(r.json.freezeAuthority === payer, "freezeAuthority mismatch");
  assert(r.json.isMutable === true, "should be mutable");
  return "authorities OK";
});

await step("POST /api/tx/mint-more → fresh wallet (server creates ATA)", async () => {
  const r = await api("/api/tx/mint-more", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.A, destination: recipient1, amount: "5000000", decimals: 6 }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "mintMore", { mint: createdMints.A });
  return "minted 5 FTA to wallet-3";
});

await step("POST /api/tx/burn — burn 100 FTA", async () => {
  const { getAssociatedTokenAddressSync } = await import("@solana/spl-token");
  const ata = getAssociatedTokenAddressSync(new PublicKey(createdMints.A), payerKp.publicKey).toBase58();
  const r = await api("/api/tx/burn", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.A, tokenAccount: ata, amount: "100000000", decimals: 6 }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "burn", { mint: createdMints.A });
  return "burned";
});

await step("POST /api/tx/multisend — 3 recipients, decimal amounts", async () => {
  const r = await api("/api/tx/multisend", {
    method: "POST",
    body: JSON.stringify({
      payer, mint: createdMints.A, decimals: 6,
      recipients: [
        { address: recipient1, amount: "1.5" },
        { address: recipient2, amount: "2.25" },
        { address: recipient3, amount: "0.000001" },
      ],
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  assert(r.json.batches?.length === 1, `expected 1 batch, got ${r.json.batches?.length}`);
  assert(r.json.quote.ataCreations >= 2, `expected ≥2 ATA creations, got ${r.json.quote.ataCreations}`);
  const b = r.json.batches[0];
  const sig = await signAndSend(b.tx, b.lastValidBlockHeight);
  await confirmAction(sig, "multisend", { mint: createdMints.A });
  return `quote total ${r.json.quote.totalSol} SOL`;
});

await step("POST /api/tx/update-metadata — rename", async () => {
  const r = await api("/api/tx/update-metadata", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.A, name: "Solana Token Test Alpha v2", symbol: "FTA", uri: "" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "updateMetadata", { mint: createdMints.A });
  return "renamed to v2";
});

await step("POST /api/tx/revoke updateAuthority (→ system program)", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.A, type: "updateAuthority" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "revokeUpdate", { mint: createdMints.A });
  return "update authority revoked";
});

await step("Negative: update-metadata after revoke → 403", async () => {
  const r = await api("/api/tx/update-metadata", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.A, name: "Should Fail", symbol: "FTA", uri: "" }),
  });
  assert(r.status === 403, `expected 403, got ${r.status} ${JSON.stringify(r.json)}`);
  return "correctly rejected";
});

// ════ 3. Token B — Token-2022, full management lifecycle ════
console.log("\n── Token B: Token-2022 ──");
const mintB = Keypair.generate();
createdMints.B = mintB.publicKey.toBase58();

await step("POST /api/tx/create-token (token2022) → on-chain", async () => {
  const r = await api("/api/tx/create-token", {
    method: "POST",
    body: JSON.stringify({
      payer, mintPublicKey: mintB.publicKey.toBase58(),
      name: "Solana Token Test T22", symbol: "FT22",
      supply: "500000", decimals: 9,
      metadataUri: "", standard: "token2022",
      revokeMint: false, revokeFreeze: false, revokeUpdate: false, customCreator: false,
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight, [mintB]);
  createdMints.B_sig = sig;
  await confirmAction(sig, "createToken", { mint: createdMints.B, name: "Solana Token Test T22", symbol: "FT22", standard: "token2022" });
  return sig.slice(0, 16) + "…";
});

await step("T22: mint-more to fresh wallet (T22 ATA via server)", async () => {
  const r = await api("/api/tx/mint-more", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, destination: recipient2, amount: "1000000000", decimals: 9 }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "mintMore", { mint: createdMints.B });
  return "minted 1 FT22 to wallet-4";
});

await step("T22: burn (program auto-detected)", async () => {
  const { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } = await import("@solana/spl-token");
  const ata = getAssociatedTokenAddressSync(
    new PublicKey(createdMints.B), payerKp.publicKey, false, TOKEN_2022_PROGRAM_ID
  ).toBase58();
  const r = await api("/api/tx/burn", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, tokenAccount: ata, amount: "1000000000", decimals: 9 }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "burn", { mint: createdMints.B });
  return "burned 1 FT22";
});

await step("T22: multisend (transferChecked w/ T22 program)", async () => {
  const r = await api("/api/tx/multisend", {
    method: "POST",
    body: JSON.stringify({
      payer, mint: createdMints.B, decimals: 9,
      recipients: [{ address: recipient1, amount: "0.5" }],
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const b = r.json.batches[0];
  const sig = await signAndSend(b.tx, b.lastValidBlockHeight);
  await confirmAction(sig, "multisend", { mint: createdMints.B });
  return "sent 0.5 FT22";
});

await step("T22: freeze wallet-4's account", async () => {
  const r = await api("/api/tx/freeze-accounts", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, wallets: [recipient2], type: "freeze" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "freezeAccounts", { mint: createdMints.B, count: 1 });
  return "frozen";
});

await step("T22: thaw wallet-4's account", async () => {
  const r = await api("/api/tx/freeze-accounts", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, wallets: [recipient2], type: "thaw" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "unfreezeAccounts", { mint: createdMints.B, count: 1 });
  return "thawed";
});

await step("T22: revoke freeze authority", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, type: "freeze" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "revokeFreeze", { mint: createdMints.B });
  return "freeze revoked";
});

await step("T22: revoke mint authority", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, type: "mint" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "revokeMint", { mint: createdMints.B });
  return "mint revoked";
});

await step("T22: make immutable (free)", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, type: "update" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "makeImmutable", { mint: createdMints.B });
  return "immutable";
});

await step("Negative: T22 mint-more after revoke → 403", async () => {
  const r = await api("/api/tx/mint-more", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.B, destination: payer, amount: "1", decimals: 9 }),
  });
  assert(r.status === 403, `expected 403, got ${r.status} ${JSON.stringify(r.json)}`);
  return "correctly rejected";
});

await step("check-authority on B: all revoked + immutable", async () => {
  const r = await checkAuthority(createdMints.B);
  assert(r.status === 200, `→ ${r.status}`);
  assert(r.json.mintAuthority === null, `mintAuthority=${r.json.mintAuthority}`);
  assert(r.json.freezeAuthority === null, `freezeAuthority=${r.json.freezeAuthority}`);
  assert(r.json.isMutable === false, "should be immutable");
  return "all revoked";
});

// ════ 4. Token C — creation-time revocations + custom creator ════
console.log("\n── Token C: SPL, revocations at creation ──");
const mintC = Keypair.generate();
createdMints.C = mintC.publicKey.toBase58();

await step("create-token w/ revokeMint+revokeFreeze+customCreator", async () => {
  const r = await api("/api/tx/create-token", {
    method: "POST",
    body: JSON.stringify({
      payer, mintPublicKey: mintC.publicKey.toBase58(),
      name: "Solana Token Test Gamma", symbol: "FTG",
      supply: "21000000", decimals: 9,
      metadataUri: "", standard: "spl",
      revokeMint: true, revokeFreeze: true, revokeUpdate: false, customCreator: true,
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight, [mintC]);
  await confirmAction(sig, "createToken", { mint: createdMints.C, name: "Solana Token Test Gamma", symbol: "FTG" });
  return sig.slice(0, 16) + "…";
});

await step("check-authority on C: mint+freeze null at birth", async () => {
  const r = await checkAuthority(createdMints.C);
  assert(r.status === 200, `→ ${r.status}`);
  assert(r.json.mintAuthority === null, `mintAuthority=${r.json.mintAuthority}`);
  assert(r.json.freezeAuthority === null, `freezeAuthority=${r.json.freezeAuthority}`);
  return "revoked at creation";
});

// ════ 4b. Cross-product gap-fill ════
// Guarantees EVERY website tool is exercised on BOTH standards. Tokens A/B/C
// left these cells uncovered:
//   SPL  standalone: freeze, unfreeze, revoke-freeze, revoke-mint, make-immutable
//   T22:             update-metadata, revoke-update (updateAuthority → system)
console.log("\n── Cross-product gap-fill ──");

// Token D — fresh SPL, all authorities intact
const mintD = Keypair.generate();
createdMints.D = mintD.publicKey.toBase58();

await step("SPL-D: create (all authorities intact)", async () => {
  const r = await api("/api/tx/create-token", {
    method: "POST",
    body: JSON.stringify({
      payer, mintPublicKey: mintD.publicKey.toBase58(),
      name: "Solana Token Test Delta", symbol: "FTD",
      supply: "1000000", decimals: 6,
      metadataUri: "", standard: "spl",
      revokeMint: false, revokeFreeze: false, revokeUpdate: false, customCreator: false,
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight, [mintD]);
  await confirmAction(sig, "createToken", { mint: createdMints.D, name: "Solana Token Test Delta", symbol: "FTD", standard: "spl" });
  return sig.slice(0, 16) + "…";
});

await step("SPL-D: mint-more to wallet-4 (freeze target)", async () => {
  const r = await api("/api/tx/mint-more", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.D, destination: recipient2, amount: "1000000", decimals: 6 }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "mintMore", { mint: createdMints.D });
  return "minted";
});

await step("SPL-D: freeze wallet-4 (classic SPL program)", async () => {
  const r = await api("/api/tx/freeze-accounts", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.D, wallets: [recipient2], type: "freeze" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "freezeAccounts", { mint: createdMints.D, count: 1 });
  return "frozen";
});

await step("SPL-D: thaw wallet-4", async () => {
  const r = await api("/api/tx/freeze-accounts", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.D, wallets: [recipient2], type: "thaw" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "unfreezeAccounts", { mint: createdMints.D, count: 1 });
  return "thawed";
});

await step("SPL-D: revoke freeze authority (standalone)", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.D, type: "freeze" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "revokeFreeze", { mint: createdMints.D });
  return "freeze revoked";
});

await step("SPL-D: revoke mint authority (standalone)", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.D, type: "mint" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "revokeMint", { mint: createdMints.D });
  return "mint revoked";
});

await step("SPL-D: make immutable (free)", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.D, type: "update" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "makeImmutable", { mint: createdMints.D });
  return "immutable";
});

await step("SPL-D: check-authority — mint+freeze null, immutable", async () => {
  const r = await checkAuthority(createdMints.D);
  assert(r.status === 200, `→ ${r.status}`);
  assert(r.json.mintAuthority === null, `mintAuthority=${r.json.mintAuthority}`);
  assert(r.json.freezeAuthority === null, `freezeAuthority=${r.json.freezeAuthority}`);
  assert(r.json.isMutable === false, "should be immutable");
  return "all locked";
});

// Token E — fresh Token-2022, exercise metadata ops on the T22 path
const mintE = Keypair.generate();
createdMints.E = mintE.publicKey.toBase58();

await step("T22-E: create (token2022, authorities intact)", async () => {
  const r = await api("/api/tx/create-token", {
    method: "POST",
    body: JSON.stringify({
      payer, mintPublicKey: mintE.publicKey.toBase58(),
      name: "Solana Token Test Epsilon", symbol: "FTE",
      supply: "500000", decimals: 9,
      metadataUri: "", standard: "token2022",
      revokeMint: false, revokeFreeze: false, revokeUpdate: false, customCreator: false,
    }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight, [mintE]);
  await confirmAction(sig, "createToken", { mint: createdMints.E, name: "Solana Token Test Epsilon", symbol: "FTE", standard: "token2022" });
  return sig.slice(0, 16) + "…";
});

await step("T22-E: update-metadata (Token-2022 path)", async () => {
  const r = await api("/api/tx/update-metadata", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.E, name: "Solana Token Test Epsilon v2", symbol: "FTE", uri: "" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "updateMetadata", { mint: createdMints.E });
  return "renamed";
});

await step("T22-E: revoke update authority (→ system program)", async () => {
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.E, type: "updateAuthority" }),
  });
  assert(r.status === 200, `build → ${r.status} ${JSON.stringify(r.json)}`);
  const sig = await signAndSend(r.json.tx, r.json.lastValidBlockHeight);
  await confirmAction(sig, "revokeUpdate", { mint: createdMints.E });
  return "update authority revoked";
});

await step("T22-E negative: update-metadata after revoke → 403", async () => {
  const r = await api("/api/tx/update-metadata", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.E, name: "Nope", symbol: "FTE", uri: "" }),
  });
  assert(r.status === 403, `expected 403, got ${r.status} ${JSON.stringify(r.json)}`);
  return "correctly rejected";
});

// ════ 5. Read APIs ════
console.log("\n── Read APIs ──");
await step("GET /api/tokens/holdings/[payer] — contains A, B, C", async () => {
  const r = await api(`/api/tokens/holdings/${payer}`);
  assert(r.status === 200, `→ ${r.status}`);
  const mints = r.json.map((h) => h.mint);
  assert(mints.includes(createdMints.A), "missing token A");
  assert(mints.includes(createdMints.B), "missing token B (Token-2022)");
  assert(mints.includes(createdMints.C), "missing token C");
  return `${r.json.length} holdings`;
});

await step("GET /api/token/[mintA] — token page data + risk flags", async () => {
  const r = await api(`/api/token/${createdMints.A}`);
  assert(r.status === 200, `→ ${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
  assert(r.json.mint === createdMints.A, "mint mismatch");
  assert(Array.isArray(r.json.riskFlags), "no riskFlags");
  const ids = r.json.riskFlags.map((f) => f.id);
  assert(ids.includes("mint_active"), `mint_active flag missing (flags: ${ids.join(",")})`);
  return `risk flags: ${ids.join(", ") || "none"}`;
});

await step("GET /api/tokens/wallet/[payer] — degrades w/o DB", async () => {
  const r = await api(`/api/tokens/wallet/${payer}`);
  assert(r.status === 200, `→ ${r.status}`);
  assert(Array.isArray(r.json), "expected array");
  return r.headers.get("x-db-degraded") ? "degraded mode (no DB)" : `${r.json.length} rows from DB`;
});

await step("GET /api/tokens/wallet/[payer]/fees — degrades w/o DB", async () => {
  const r = await api(`/api/tokens/wallet/${payer}/fees`);
  assert(r.status === 200, `→ ${r.status}`);
  assert(Array.isArray(r.json), "expected array");
  return r.headers.get("x-db-degraded") ? "degraded mode (no DB)" : `${r.json.length} fee events`;
});

// ════ 6. Input validation negatives ════
console.log("\n── Validation negatives ──");
await step("create-token: supply overflow (u64) → 400", async () => {
  const r = await api("/api/tx/create-token", {
    method: "POST",
    body: JSON.stringify({
      payer, mintPublicKey: Keypair.generate().publicKey.toBase58(),
      name: "X", symbol: "X", supply: "99999999999999999999", decimals: 9,
      metadataUri: "", standard: "spl",
      revokeMint: false, revokeFreeze: false, revokeUpdate: false, customCreator: false,
    }),
  });
  assert(r.status === 400, `expected 400, got ${r.status}`);
  return "rejected";
});

await step("multisend: duplicate recipient → 400", async () => {
  const r = await api("/api/tx/multisend", {
    method: "POST",
    body: JSON.stringify({
      payer, mint: createdMints.A, decimals: 6,
      recipients: [
        { address: recipient1, amount: "1" },
        { address: recipient1, amount: "2" },
      ],
    }),
  });
  assert(r.status === 400, `expected 400, got ${r.status}`);
  return "rejected";
});

await step("burn: non-integer amount → 400", async () => {
  const r = await api("/api/tx/burn", {
    method: "POST",
    body: JSON.stringify({ payer, mint: createdMints.A, tokenAccount: payer, amount: "1.5", decimals: 6 }),
  });
  assert(r.status === 400, `expected 400, got ${r.status}`);
  return "rejected";
});

await step("revoke: wrong wallet (not authority) → 403", async () => {
  const other = wallets[5].publicKey;
  const r = await api("/api/tx/revoke", {
    method: "POST",
    body: JSON.stringify({ payer: other, mint: createdMints.A, type: "mint" }),
  });
  assert(r.status === 403, `expected 403, got ${r.status} ${JSON.stringify(r.json)}`);
  return "rejected";
});

await step("confirm: fee-less fake signature → 400", async () => {
  const r = await api("/api/confirm", {
    method: "POST",
    body: JSON.stringify({
      signature: "5".repeat(87), action: "createToken", wallet: payer, mint: createdMints.A,
    }),
  });
  assert(r.status === 400, `expected 400, got ${r.status}`);
  return "rejected";
});

// ════ summary ════
const endBal = await conn.getBalance(payerKp.publicKey) / LAMPORTS_PER_SOL;
const feeWalletEnd = FEE_WALLET ? await conn.getBalance(new PublicKey(FEE_WALLET)) / LAMPORTS_PER_SOL : 0;

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;
console.log(`\n${"─".repeat(64)}`);
console.log(`  ${passed} passed, ${failed} failed of ${results.length}`);
console.log(`  payer spent: ${(startBal - endBal).toFixed(4)} SOL | fee wallet received: ${(feeWalletEnd - feeWalletStart).toFixed(4)} SOL`);
console.log(`  mints: A=${createdMints.A}\n         B=${createdMints.B}\n         C=${createdMints.C}\n         D=${createdMints.D}\n         E=${createdMints.E}`);

writeFileSync(
  join(__dirname, `${NETWORK}-e2e-results.json`),
  JSON.stringify({ ranAt: new Date().toISOString(), base: BASE, network: NETWORK, payer, createdMints, startBal, endBal, feeWalletStart, feeWalletEnd, results }, null, 2)
);
console.log(`  results → scripts/${NETWORK}-e2e-results.json\n`);

process.exit(failed > 0 ? 1 : 0);
