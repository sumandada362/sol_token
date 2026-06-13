#!/usr/bin/env node
/**
 * Page smoke test — checks every route renders with the expected status,
 * plus content assertions (network banner, OG image type, sitemap/robots).
 *
 *   node scripts/smoke-pages.mjs           # against http://localhost:3000
 *   BASE_URL=https://... node scripts/smoke-pages.mjs
 *
 * Network-dependent pages (/token/[mint]) get a relaxed assertion: any
 * non-5xx is a pass — data providers may be unavailable on test clusters.
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function readEnv(key) {
  try {
    const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
    const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1].trim() : null;
  } catch { return null; }
}
const NETWORK = readEnv("NEXT_PUBLIC_SOLANA_NETWORK") ?? "devnet";
const BANNER = NETWORK === "mainnet-beta" ? null : NETWORK.toUpperCase();

/** [path, expectedStatus, { contains?, contentType?, notContains? }] */
const ROUTES = [
  ["/", 200, BANNER ? { contains: BANNER } : {}],
  ["/create-token", 200, {}],
  ["/burn", 200, {}],
  ["/tools", 200, {}],
  ["/tools/mint-tokens", 200, {}],
  ["/tools/multisender", 200, {}],
  ["/tools/update-metadata", 200, {}],
  ["/tools/revoke-mint", 200, {}],
  ["/tools/revoke-freeze", 200, {}],
  ["/tools/revoke-update", 200, {}],
  ["/tools/make-immutable", 200, {}],
  ["/tools/freeze-account", 200, {}],
  ["/tools/unfreeze-account", 200, {}],
  ["/tools/sol-converter", 200, {}],
  ["/tools/unit-converter", 200, {}],
  ["/tools/burn-lp", 200, {}],
  ["/tools/market/create", 200, {}],
  ["/pool", 200, {}],
  ["/pool/add", 200, {}],
  ["/pool/remove", 200, {}],
  ["/blog", 200, {}],
  ["/blog/how-to-revoke-update-authority-solana", 200, {}],
  ["/blog/spl-vs-token-2022", 200, {}],
  ["/docs", 200, {}],
  ["/docs/create-token", 200, {}],
  ["/docs/fees-and-costs", 200, {}],
  ["/docs/token-authorities", 200, {}],
  ["/legal/terms", 200, {}],
  ["/legal/privacy", 200, {}],
  ["/legal/risk", 200, {}],
  ["/og?title=SmokeTest", 200, { contentType: "image/png" }],
  ["/sitemap.xml", 200, { contains: "/blog/" }],
  ["/robots.txt", 200, { contains: "/api/" }],
  ["/this-route-does-not-exist", 404, {}],
  ["/docs/this-slug-does-not-exist", 404, {}],
  ["/blog/this-slug-does-not-exist", 404, {}],
];

let pass = 0, fail = 0;
console.log(`\nPage smoke test — ${BASE} (network: ${NETWORK})\n`);

for (const [path, expected, checks] of ROUTES) {
  let verdict = null;
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    if (res.status !== expected) {
      verdict = `status ${res.status}, expected ${expected}`;
    } else if (checks.contentType && !(res.headers.get("content-type") ?? "").includes(checks.contentType)) {
      verdict = `content-type ${res.headers.get("content-type")}, expected ${checks.contentType}`;
    } else if (checks.contains) {
      const body = await res.text();
      if (!body.includes(checks.contains)) verdict = `body missing "${checks.contains}"`;
    }
  } catch (err) {
    verdict = String(err.message ?? err);
  }
  if (verdict) { fail++; console.log(`  ✗  ${path} — ${verdict}`); }
  else { pass++; console.log(`  ✓  ${path}`); }
}

console.log(`\n  ${pass} passed, ${fail} failed of ${ROUTES.length}\n`);
process.exit(fail > 0 ? 1 : 0);
