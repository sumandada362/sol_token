# Solana Token — Full App Testnet Testing Guide

Complete manual + scripted test plan for running the entire app against **Solana testnet**.
Estimated time for a full pass: **2–3 hours**. For the shorter pre-deploy devnet pass, see
[regression.md](regression.md).

> **Why testnet?** Testnet validates the app against a cluster that behaves more like
> mainnet (different validators, stricter airdrops, no Helius/Birdeye support) and proves
> the app's graceful-degradation paths work. Devnet is for fast iteration; testnet is for
> "does this survive a less friendly environment?"

---

## 1. Testnet vs devnet — what changes

The app supports `devnet`, `testnet`, and `mainnet-beta` via `NEXT_PUBLIC_SOLANA_NETWORK`.
A startup guardrail in [lib/solana/connection.ts](../lib/solana/connection.ts) throws if the
network and RPC URL disagree (e.g. `testnet` network with a `devnet` RPC).

| Area | Devnet | Testnet | What to verify on testnet |
|---|---|---|---|
| RPC | Helius devnet (API key) | Public `api.testnet.solana.com` only — Helius has **no testnet endpoint** | App works on plain public RPC |
| Airdrops | Generous (`solana airdrop 2`) | Heavily rate-limited (~1 SOL/request, often refused) | Pre-fund wallets before the session |
| Helius DAS (holder counts, enriched holdings) | Available | **Unavailable** | Holder count renders as `—`/null, no error. Holdings fall back to plain RPC (mints + balances, no logos/symbols) |
| Birdeye (price/volume/liquidity) | Limited | **No data** | Market stats render as `—`, no crash |
| Explorer links | `?cluster=devnet` | `?cluster=testnet` | Every external link opens the right cluster |
| Banner | Amber `DEVNET` bar | Amber `TESTNET` bar | Visible on every page |
| IPFS (Pinata) | Real uploads | Real uploads (network-independent) | Logo upload works identically |

---

## 2. Prerequisites

### Software
- Node 20+, pnpm
- Postgres (optional — see §3) and Redis (optional — `node scripts/dev-redis.mjs` provides an in-memory stand-in)
- A browser wallet: Phantom, Solflare, or Backpack

### Accounts / keys
- Pinata JWT (same account as devnet — IPFS is network-independent)
- A **testnet-only fee wallet** keypair you control. Never reuse a mainnet wallet.

### Test wallets
You need at least **3 funded testnet wallets**:

| Wallet | Role | Min balance |
|---|---|---|
| W1 — creator | Creates tokens, pays fees, runs every flow | ≥ 2 SOL |
| W2 — recipient | Multisend target, freeze-account target | ≥ 0.05 SOL |
| W3 — fresh recipient | Multisend target with **no ATA** (tests ATA creation) | 0 SOL (never used) |

Generate them with the wallet script pointed at testnet (airdrop will be slow or fail —
use `--no-airdrop` and fund manually if needed). Use **6** wallets so the e2e script
(which reads wallet indices 1–6) works from the same file:

```bash
node scripts/generate-wallets.mjs --count 6 --rpc https://api.testnet.solana.com --no-airdrop
```

The output lands in `scripts/testnet-wallets.json` + `.txt` automatically — the
network (and default output name) is inferred from `--rpc`.

Funding options, in order of reliability:
1. https://faucet.solana.com — select **Testnet**, paste address
2. `solana airdrop 1 <ADDRESS> --url https://api.testnet.solana.com` (retry with backoff; requests >1 SOL usually fail)
3. Transfer between your own testnet wallets

Import the mnemonics from `scripts/testnet-wallets.txt` into your browser wallet, then
switch the wallet extension's network to **Testnet** (Phantom: Settings → Developer Settings → Testnet Mode → Solana Testnet).

---

## 3. Environment setup

1. Copy the testnet env template:

   ```bash
   cp .env.testnet.example .env.local
   ```

2. Fill in `.env.local`:

   | Variable | Value | Notes |
   |---|---|---|
   | `SOLANA_RPC_URL` | `https://api.testnet.solana.com` | Server-side RPC |
   | `NEXT_PUBLIC_RPC_URL` | `https://api.testnet.solana.com` | Browser wallet adapter RPC |
   | `NEXT_PUBLIC_SOLANA_NETWORK` | `testnet` | Drives banner, explorer links, guardrail |
   | `FEE_WALLET_ADDRESS` | public key of your **testnet** fee wallet | Receives platform fees |
   | `PINATA_JWT` | your Pinata JWT | Required for logo upload |
   | `HELIUS_API_KEY` | leave empty | No testnet support — exercises fallback paths |
   | `BIRDEYE_API_KEY` | leave empty | No testnet data — exercises "—" rendering |
   | `DATABASE_URL` | optional | Without it, `/api/confirm` still verifies fees on-chain and returns `recorded:false`; list endpoints return `[]` |
   | `REDIS_URL` | `redis://localhost:6379` or run `node scripts/dev-redis.mjs` | Without Redis: rate limiting fails open, caches no-op |
   | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | |

3. Start the app:

   ```bash
   pnpm install
   pnpm dev
   ```

### Startup verification (must pass before any feature testing)

| # | Check | Expected |
|---|---|---|
| S1 | Terminal output on startup | **No** `[guardrail]` error |
| S2 | Negative test: temporarily set `SOLANA_RPC_URL` to a devnet URL, restart | Startup **throws** `[guardrail] NEXT_PUBLIC_SOLANA_NETWORK=testnet but SOLANA_RPC_URL contains "devnet"`. Revert afterwards. |
| S3 | Open http://localhost:3000 | Amber banner: **TESTNET — tokens have no real value · transactions use test SOL only** |
| S4 | Connect W1 in the navbar | Wallet connects; balance shown matches testnet balance |
| S5 | Any "View on Solscan/Explorer" link | URL contains `?cluster=testnet` |

---

## 4. Fee schedule (assert on every paid flow)

From [lib/solana/fees.ts](../lib/solana/fees.ts). Every paid transaction includes a
SOL transfer to `FEE_WALLET_ADDRESS` — verify the wallet's pre-sign simulation shows it,
and spot-check the fee wallet balance after each section.

| Action | Platform fee |
|---|---|
| Create token | 0.1 SOL |
| Custom creator (create option) | +0.1 SOL |
| Mint more | 0.05 SOL |
| Update metadata | 0.05 SOL |
| Revoke mint / freeze / update authority | 0.05 SOL each |
| Make immutable | free |
| Burn | free |
| Freeze account | 0.01 SOL |

---

## 5. Feature tests

Record Pass/Fail and the tx signature for each row. All flows run as **W1** unless stated.

### T1. Token creation ★ (`/create-token`)

| # | Step | Expected |
|---|---|---|
| 1.1 | Create SPL token: name `TNTEST`, symbol `TNT`, 9 decimals, supply 1,000,000, PNG logo | Wallet prompts once; token minted; mint address shown; fee 0.1 SOL in simulation |
| 1.2 | Open the mint on explorer (`?cluster=testnet`) | Name/symbol/logo present; supply correct |
| 1.3 | Create a **Token-2022** token, same params | Different mint; explorer shows Token-2022 program |
| 1.4 | Create with **revoke mint + revoke freeze** checked in the same flow | Single signing flow; afterwards security checker shows both revoked |
| 1.5 | Create with **custom creator** option | Fee shows 0.1 + 0.1 = 0.2 SOL; creator field on-chain matches input |
| 1.6 | BalanceCheck: use a wallet with < 0.11 SOL, open confirm step | Balance row shows insufficient-state warning **before** signing |
| 1.7 | Validation: empty name, symbol > max length, 0/negative supply, decimals > 9 | Inline validation errors; no wallet prompt |
| 1.8 | Logo upload: SVG file | Rejected — "Only PNG, JPG, and WebP" |
| 1.9 | Logo upload: file > 2 MB | Rejected with clear size error |
| 1.10 | Disconnect wallet mid-flow → reconnect | Flow resumes or restarts cleanly; no ghost state |
| 1.11 | Reject the transaction in the wallet popup | App returns to confirm step with a friendly message; no stuck spinner |

### T2. Token page & security checker ★ (`/token/[mint]`)

| # | Step | Expected |
|---|---|---|
| 2.1 | Open `/token/<TNT mint>` | Name, symbol, logo, supply, decimals render |
| 2.2 | Holder count | Renders as `—`/null **without error** (Helius DAS unavailable on testnet) |
| 2.3 | Price / volume / liquidity | Render as `—` (no Birdeye testnet data); page does not crash |
| 2.4 | Authority status for a fresh (un-revoked) token | Mint + freeze + update show **active** warnings |
| 2.5 | Authority status for the token from 1.4 | Mint + freeze show revoked ✓ |
| 2.6 | Open a garbage mint address `/token/abc123` | 404 or clear "not found" — no unhandled error |

### T3. Burn ★ (`/burn`)

| # | Step | Expected |
|---|---|---|
| 3.1 | Token selector lists W1's tokens | TNT appears. **Testnet note:** logos/symbols may be missing (plain-RPC fallback) but mint + balance must be correct |
| 3.2 | Burn 1,000 TNT | No platform fee; balance and supply decrease by 1,000 |
| 3.3 | Burn more than balance | Validation error before signing |
| 3.4 | Burn 0 / negative / non-numeric | Validation error before signing |

### T4. Mint more (`/tools/mint-tokens`)

| # | Step | Expected |
|---|---|---|
| 4.1 | Mint 500,000 more TNT | Fee 0.05 SOL; supply increases by 500,000 |
| 4.2 | Select the mint-revoked token from 1.4 | Action blocked: disabled button or "Mint authority already revoked" |
| 4.3 | Connect W2 (not the mint authority), try to mint TNT | Blocked before signing — authority check fails |

### T5. Update metadata (`/tools/update-metadata`)

| # | Step | Expected |
|---|---|---|
| 5.1 | Update TNT description | Fee 0.05 SOL; new description on `/token/[mint]` (allow cache TTL or flush Redis) |
| 5.2 | Upload a new valid PNG logo | New logo renders on token page and explorer |
| 5.3 | Attempt on an immutable token (after T6.4) | Blocked: update authority revoked |

### T6. Revoke authorities ★ (`/tools/revoke-mint`, `/tools/revoke-freeze`, `/tools/revoke-update`, `/tools/make-immutable`)

Use a throwaway token created for this section so TNT keeps its authorities for other tests.

| # | Step | Expected |
|---|---|---|
| 6.1 | Revoke mint authority | Fee 0.05 SOL; security checker shows mint revoked ✓; repeat attempt is blocked |
| 6.2 | Revoke freeze authority | Fee 0.05 SOL; freeze revoked ✓ |
| 6.3 | Revoke update authority (`/tools/revoke-update` — new this branch) | Fee 0.05 SOL; update revoked ✓; `/tools/update-metadata` now blocks this token |
| 6.4 | Make immutable (`/tools/make-immutable`) | **Free**; same on-chain result as 6.3 |
| 6.5 | Run any revoke as a non-authority wallet (W2) | Blocked before signing |

### T7. Freeze / unfreeze (`/tools/freeze-account`, `/tools/unfreeze-account`)

Requires a token that still has freeze authority (TNT).

| # | Step | Expected |
|---|---|---|
| 7.1 | Send some TNT to W2 first (use multisender or wallet transfer) | W2 holds TNT |
| 7.2 | Freeze W2's TNT account | Fee 0.01 SOL; W2 cannot transfer TNT (try it — wallet tx fails) |
| 7.3 | Unfreeze W2's account | W2 can transfer again |
| 7.4 | Freeze using the freeze-revoked token from T6 | Blocked: no freeze authority |

### T8. Multisender (`/tools/multisender`)

| # | Step | Expected |
|---|---|---|
| 8.1 | Upload CSV with 25 rows (mix of W2, W3, and generated addresses; 10 TNT each) | Preview table shows 25 rows, totals correct, no validation errors |
| 8.2 | Execute | All transfers confirm; summary shows 0 failures; W3 (fresh wallet, no ATA) received — ATA creation worked |
| 8.3 | Malformed CSV: missing amount column | Clear error; no tx built |
| 8.4 | CSV with one invalid address among valid rows | That row flagged; either blocked or excluded with explicit notice |
| 8.5 | Amounts exceeding W1's balance | Validation error before signing |
| 8.6 | Kill the tab mid-send → reopen → resume | Remaining batches send; **no duplicate transfers** (check W2 balance math) |

### T9. Wallet holdings & token pickers

| # | Step | Expected |
|---|---|---|
| 9.1 | `GET /api/tokens/holdings/<W1>` | 200; JSON lists TNT mint + balance. Logos/symbols may be absent (plain-RPC fallback — by design on testnet) |
| 9.2 | TokenSelect dropdown on burn/mint/update pages | Lists W1 tokens; missing logos render the letter-fallback avatar, not a broken image |
| 9.3 | `GET /api/tokens/wallet/<W1>` and `/fees` | 200 with data, or `[]` if `DATABASE_URL` unset — never a 500 |

### T10. Converters (client-side, no wallet needed)

| # | Step | Expected |
|---|---|---|
| 10.1 | `/tools/sol-converter`: convert SOL ↔ lamports both directions | Exact math (1 SOL = 1,000,000,000 lamports); handles decimals |
| 10.2 | `/tools/unit-converter`: token amount ↔ raw with various decimals (0, 6, 9) | Correct conversions; no precision loss on display |

### T11. Coming-soon pages (must not expose any transaction flow)

| # | Page | Expected |
|---|---|---|
| 11.1 | `/pool`, `/pool/add`, `/pool/remove` | Render "in development" content; DEX cards visible; no signing UI |
| 11.2 | `/tools/burn-lp` | Coming-soon; no tx flow |
| 11.3 | `/tools/market/create` | Coming-soon; no tx flow |
| 11.4 | `/tools` grid | Live tools clickable; coming-soon tools clearly labeled |

### T12. Content & SEO

| # | Step | Expected |
|---|---|---|
| 12.1 | `/blog` and one post (e.g. `/blog/how-to-revoke-update-authority-solana` — new this branch) | MDX renders; TOC links work |
| 12.2 | `/docs/create-token`, `/docs/fees-and-costs`, `/docs/token-authorities` | Render; fee badges match §4 |
| 12.3 | Page source on any page | `application/ld+json` block present |
| 12.4 | `GET /og?title=Test` | Returns `image/png` |
| 12.5 | `GET /sitemap.xml`, `GET /robots.txt` | Blog/docs slugs present; `/api/` disallowed |
| 12.6 | `/legal/terms`, `/legal/privacy`, `/legal/risk` | Render |

### T13. Scripted API & security tests

```bash
# Adversarial suite — rate limits, CSRF, file validation, headers.
# No funded wallet needed; must exit 0.
pnpm test:adversarial

# Full e2e through the HTTP API with real signed transactions.
# Reads SOLANA_RPC_URL from .env.local, so it follows your testnet config and
# automatically loads scripts/testnet-wallets.json (override with the
# E2E_WALLETS_FILE env var). Fund wallet-1 (the payer) before running —
# testnet faucet limits make airdrop-dependent steps slow.
pnpm test:e2e
```

| # | Check | Expected |
|---|---|---|
| 13.1 | `pnpm test:adversarial` | Exit 0, all tests pass |
| 13.2 | `pnpm test:e2e` against testnet | All steps pass; results in `scripts/testnet-e2e-results.json` |
| 13.3 | `curl -I http://localhost:3000/` | `X-Frame-Options: DENY` and `Content-Security-Policy` present (`Strict-Transport-Security` on the deployed HTTPS domain) |
| 13.4 | Hammer one tx endpoint > rate limit (with Redis running) | 429 responses kick in |

### T14. Fee accounting ★

| # | Step | Expected |
|---|---|---|
| 14.1 | Note fee wallet balance before T1, after T8 | Increase = 0.1 (+0.1 custom creator) + 0.05×(mint more + metadata + 3 revokes) + 0.01 freeze = matches your executed set exactly |
| 14.2 | `POST /api/confirm` flow after a paid tx (happens automatically in UI) | With DB: `recorded:true`. Without DB: fee still **verified on-chain**, `recorded:false` — never a 500 |
| 14.3 | Tamper test: call `/api/confirm` with a signature of a tx that paid no fee | Rejected — confirm verifies the fee transfer on-chain |

---

## 6. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `[guardrail]` throw on startup | Network/RPC mismatch in `.env.local` — both must say testnet |
| Airdrop fails repeatedly | Testnet faucet limits. Use https://faucet.solana.com, smaller amounts (≤1 SOL), or transfer between your own wallets |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE` from Node scripts on Windows | Known Node 22 TLS issue — the scripts already patch fetch for it; only affects scripts, not the app |
| Tokens show no logo/symbol in pickers | Expected on testnet (no Helius DAS). Mint + balance must still be right |
| Holder count / price empty | Expected on testnet — verify it renders as `—`, not an error |
| Stale token page after metadata update | Redis cache TTL — flush Redis or wait |
| Public testnet RPC 429s during multisend | Public RPC rate limits; slow down batches or retry |

---

## 7. Sign-off

A release is testnet-approved when every ★ section (T1, T2, T3, T6, T14) passes 100%
and no section has an unexplained failure.

| Pass # | Date | Tester | Browser / wallet | Commit | Notes |
|---|---|---|---|---|---|
| Testnet #1 | 2026-06-13 | Claude (scripted) | HTTP API + signed Keypairs (no browser) | 23c314c + testnet fixes | **e2e 45/45 — full SPL×Token-2022 cross-product** (every tool on both standards) · adversarial 12/12 · smoke 36/36 · fees exact (+3.9100 SOL). Fixed: Umi finalized-commitment staleness, multisend fee journaling, wallet-script network detection, CSRF origin allowlist, immutable-state guards. See [AUDIT-REPORT-TESTNET-2026-06-13.md](AUDIT-REPORT-TESTNET-2026-06-13.md) §1b for the coverage matrix |
| Testnet #2 | | | | | (manual browser-wallet pass — see §5 T1–T12 UI rows not covered by scripts) |
