#!/usr/bin/env tsx
/**
 * Adversarial spot-check script — implements QA Matrix B5.
 *
 * Run against a local dev server:
 *   pnpm dlx tsx scripts/test-adversarial.ts
 *   BASE_URL=https://your-preview.vercel.app pnpm dlx tsx scripts/test-adversarial.ts
 *
 * The script hits real HTTP endpoints and verifies input-handling behavior.
 * It does NOT require a funded wallet or live blockchain — all transactions
 * will fail Solana validation, but the security properties (rate limits,
 * CSRF, file validation, headers) are tested at the HTTP layer.
 *
 * Exit code: 0 = all passed, 1 = one or more failed.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    results.push({ name, pass: true, detail: "ok" });
  } catch (err) {
    results.push({ name, pass: false, detail: String(err) });
  }
}

function assert(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const FAKE_PUBKEY = "11111111111111111111111111111111";
const JSON_HEADERS = { "Content-Type": "application/json" };

// ---------------------------------------------------------------------------
// B5-1: Rate limiting
// ---------------------------------------------------------------------------

await test("Rate limit: 21st POST /api/tx/create-token returns 429", async () => {
  const body = JSON.stringify({
    payer: FAKE_PUBKEY, name: "X", symbol: "X",
    decimals: 9, supply: "1", revokeMint: false, revokeFreeze: false,
  });
  let lastStatus = 0;
  for (let i = 0; i < 22; i++) {
    const r = await fetch(`${BASE_URL}/api/tx/create-token`, {
      method: "POST", headers: JSON_HEADERS, body,
    });
    lastStatus = r.status;
    if (r.status === 429) break;
  }
  assert(lastStatus === 429, `Expected 429 after 20 requests, got ${lastStatus}`);
});

// ---------------------------------------------------------------------------
// B5-2: Upload validation
// ---------------------------------------------------------------------------

await test("Upload: SVG file rejected with 400", async () => {
  const form = new FormData();
  const blob = new Blob(
    ["<svg xmlns='http://www.w3.org/2000/svg'><rect width='10' height='10'/></svg>"],
    { type: "image/svg+xml" }
  );
  form.append("file", blob, "logo.svg");
  const r = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
  assert(r.status === 400, `Expected 400, got ${r.status}`);
});

await test("Upload: Oversized file (3 MB PNG magic bytes) rejected with 400", async () => {
  const buf = new Uint8Array(3 * 1024 * 1024);
  // Valid PNG magic bytes so it passes the extension check but fails the size check
  buf.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), "big.png");
  const r = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
  assert(r.status === 400, `Expected 400, got ${r.status}`);
  const json = await r.json().catch(() => ({}));
  assert(
    JSON.stringify(json).toLowerCase().includes("mb") ||
    JSON.stringify(json).toLowerCase().includes("size") ||
    JSON.stringify(json).toLowerCase().includes("large"),
    `Expected size error in body, got: ${JSON.stringify(json)}`
  );
});

await test("Upload: Path traversal filename ../../etc/passwd rejected with 400", async () => {
  const buf = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const form = new FormData();
  form.append("file", new Blob([buf], { type: "image/png" }), "../../etc/passwd");
  const r = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
  assert(r.status === 400, `Expected 400, got ${r.status}`);
});

await test("Upload: Fake PNG (SVG content with .png extension) rejected with 400", async () => {
  // SVG bytes disguised as a .png file — magic-byte check must catch this
  const svgBytes = new TextEncoder().encode(
    "<svg xmlns='http://www.w3.org/2000/svg'></svg>"
  );
  const form = new FormData();
  form.append("file", new Blob([svgBytes], { type: "image/png" }), "evil.png");
  const r = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: form });
  assert(r.status === 400, `Expected 400 (magic-byte rejection), got ${r.status}`);
});

// ---------------------------------------------------------------------------
// B5-3: Confirm endpoint idempotency & error sanitization
// ---------------------------------------------------------------------------

await test("Confirm: Returns non-500 on fake signature (no server crash)", async () => {
  const body = JSON.stringify({
    signature: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    action: "createToken",
    wallet: FAKE_PUBKEY,
  });
  const r = await fetch(`${BASE_URL}/api/confirm`, {
    method: "POST", headers: JSON_HEADERS, body,
  });
  assert(r.status !== 500, `Confirm crashed with 500`);
  const json = await r.json().catch(() => ({}));
  // Error message must not leak internal details
  if (r.status >= 400) {
    const msg: string = json?.error ?? "";
    assert(!msg.includes("RPC"), `Response leaks "RPC": ${msg}`);
    assert(!msg.includes("connection"), `Response leaks "connection": ${msg}`);
    assert(!msg.includes("stack"), `Response leaks "stack": ${msg}`);
  }
});

await test("Confirm: Duplicate signature returns non-500 (idempotent)", async () => {
  const body = JSON.stringify({
    signature: "CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC",
    action: "createToken",
    wallet: FAKE_PUBKEY,
  });
  const opts = { method: "POST", headers: JSON_HEADERS, body };
  const r1 = await fetch(`${BASE_URL}/api/confirm`, opts);
  const r2 = await fetch(`${BASE_URL}/api/confirm`, opts);
  assert(r1.status !== 500, `First confirm returned 500`);
  assert(r2.status !== 500, `Second confirm (replay) returned 500`);
});

// ---------------------------------------------------------------------------
// B5-4: Security headers
// ---------------------------------------------------------------------------

await test("Security headers: X-Frame-Options is DENY", async () => {
  const r = await fetch(`${BASE_URL}/`);
  const h = r.headers.get("x-frame-options");
  assert(h === "DENY", `Expected "DENY", got "${h}"`);
});

await test("Security headers: Content-Security-Policy present", async () => {
  const r = await fetch(`${BASE_URL}/`);
  const h = r.headers.get("content-security-policy");
  assert(!!h, "Content-Security-Policy header is missing");
  assert(h!.includes("default-src"), `CSP looks malformed: ${h}`);
});

await test("Security headers: X-Content-Type-Options is nosniff", async () => {
  const r = await fetch(`${BASE_URL}/`);
  const h = r.headers.get("x-content-type-options");
  assert(h === "nosniff", `Expected "nosniff", got "${h}"`);
});

await test("Security headers: HSTS present (HTTPS only — skip on localhost)", async () => {
  if (BASE_URL.startsWith("http://")) {
    // HSTS is only sent over HTTPS; skip silently for localhost
    return;
  }
  const r = await fetch(`${BASE_URL}/`);
  const h = r.headers.get("strict-transport-security");
  assert(!!h, "Strict-Transport-Security header is missing");
});

// ---------------------------------------------------------------------------
// B5-5: CSRF check (cross-origin POST blocked)
// ---------------------------------------------------------------------------

await test("CSRF: Cross-origin POST to /api/tx/create-token returns 403", async () => {
  const r = await fetch(`${BASE_URL}/api/tx/create-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Origin": "https://evil.example.com",
      "Sec-Fetch-Site": "cross-site",
    },
    body: JSON.stringify({ payer: FAKE_PUBKEY }),
  });
  assert(r.status === 403, `Expected 403 (CSRF block), got ${r.status}`);
});

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log(`\nAdversarial test results — ${BASE_URL}\n${"─".repeat(60)}`);
let passed = 0;
let failed = 0;
for (const r of results) {
  if (r.pass) {
    console.log(`  ✓  ${r.name}`);
    passed++;
  } else {
    console.log(`  ✗  ${r.name}`);
    console.log(`       ${r.detail}`);
    failed++;
  }
}
console.log(`${"─".repeat(60)}\n  ${passed} passed  ${failed} failed\n`);

process.exit(failed > 0 ? 1 : 0);
