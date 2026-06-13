# Solana Token — Testnet Phase: Audit, Live Test & Mainnet-Readiness Report

**Date:** 2026-06-13 · **Scope:** entire `token/` app on **Solana testnet** · **Server:** production build (`pnpm build` + `pnpm start`), in-memory Redis stand-in, no Postgres (degraded-mode paths exercised deliberately)

Continues [AUDIT-REPORT-2026-06-12.md](AUDIT-REPORT-2026-06-12.md) (devnet phase, 11 bugs fixed, 33/33). This phase ran the evidence suites against testnet — a less friendly cluster (public RPC only, no Helius DAS, no Birdeye, slower finalization) — found **6 new issues**, fixed them, then **extended the E2E to a complete SPL × Token-2022 cross-product** so that every transaction tool on the site is proven on **both** token standards. Final state: **45/45, zero untested tool×standard cells.**

---

## 1. Verdict

**Testnet phase: PASSED.** The app is approved to proceed to the mainnet testing session described in [mainnet-readiness.md](mainnet-readiness.md), after the hard blockers listed there (key rotation, managed Postgres/Redis, hardware fee wallet) are done.

| Verification (all on the final production build) | Result |
|---|---|
| TypeScript (`tsc --noEmit`) | ✅ 0 errors |
| ESLint | ✅ 0 errors (11 cosmetic warnings, unchanged) |
| Production build, clean `.next` | ✅ pass |
| Adversarial security suite (12 tests) | ✅ 12/12 |
| Page smoke test — **new `pnpm test:smoke`** (36 routes/assertions) | ✅ 36/36 |
| Testnet E2E — **full SPL×Token-2022 cross-product** (45 tests, ~30 real signed txs) | ✅ **45/45** (run 4) — earlier 33-test runs 2 & 3 also 33/33 |
| Fee integrity, verified on-chain every run | ✅ exact to the lamport — see §4 |

**Final-run mints (testnet, run 4 — the cross-product run):**
- A (SPL + IPFS metadata): `CP8DXFPnMwQfVNxJPYJK4R4fAmCM3hfveE5AbjzKGXvE`
- B (Token-2022 full lifecycle): `DMghtbpTKbYxRb2T7JWzouCnfJK4h8R33PR8eVuyqcuk`
- C (SPL, revoked-at-creation + custom creator): `DdhFLoAMpLZobPkA3P4Pze8kuYoybeyQfEQku1wjRk8C`
- D (SPL, standalone freeze/unfreeze/revoke/immutable): `9eSQD2HnNc64XXACmyuefpt5nQzHawm3kXMMxPypuuyx`
- E (Token-2022, metadata update + revoke-update): `76BVU6XwSetXvogFhNzks7Juf3g83vpNcAs3NNvhAYaY`

Full per-test detail with signatures: `scripts/testnet-e2e-results.json`.

---

## 1b. Complete tool × standard coverage matrix

**Every transaction tool listed on the site, proven live on both standards.** Each ✅ is a real signed transaction confirmed on testnet in run 4 (token in parentheses; see mints above).

| # | Website tool | Route | SPL | Token-2022 |
|---|---|---|---|---|
| 1 | Create Token | `/create-token` | ✅ A, C, D | ✅ B, E |
| 2 | Mint Tokens | `/tools/mint-tokens` | ✅ A, D | ✅ B |
| 3 | Burn Tokens | `/burn` | ✅ A | ✅ B |
| 4 | Multisender | `/tools/multisender` | ✅ A | ✅ B |
| 5 | Update Metadata | `/tools/update-metadata` | ✅ A | ✅ **E** |
| 6 | Revoke Mint | `/tools/revoke-mint` | ✅ **D** (standalone) + C (at creation) | ✅ B |
| 7 | Revoke Freeze | `/tools/revoke-freeze` | ✅ **D** (standalone) + C (at creation) | ✅ B |
| 8 | Revoke Update | `/tools/revoke-update` | ✅ A | ✅ **E** |
| 9 | Freeze Account | `/tools/freeze-account` | ✅ **D** | ✅ B |
| 10 | Unfreeze Account | `/tools/unfreeze-account` | ✅ **D** | ✅ B |
| 11 | Make Immutable | `/tools/make-immutable` | ✅ **D** | ✅ B |
| — | Sol Converter | `/tools/sol-converter` | client-side math, no token standard — smoke-verified render |
| — | Unit Converter | `/tools/unit-converter` | client-side math, no token standard — smoke-verified render |
| — | Pool / Add / Remove | `/pool*` | "coming soon" — smoke-verified no signing UI |
| — | Burn LP | `/tools/burn-lp` | "coming soon" — smoke-verified no signing UI |
| — | OpenBook Market | `/tools/market/create` | "coming soon" — smoke-verified no signing UI |

The **bold** cells were the 7 gaps the user flagged: in runs 1–3 those operations had only been exercised on one standard each. Tokens **D** (fresh SPL, all authorities intact) and **E** (fresh Token-2022) were added in run 4 specifically to close them. Each builder sensitive to program detection (`getMintProgramId`: burn, mint-more, revoke mint/freeze, freeze/thaw, multisend) is now proven on both the classic SPL program **and** Token-2022. The metadata builders (create / update / revoke-update / make-immutable, via Metaplex `createV1`/`updateV1`) are likewise proven on both. **No tool ships untested on either standard.**

---

## 2. What testnet exposed (run 1: 19/33) and how it was fixed

Run 1 failed 14 of 33 steps. Every on-chain transaction had actually succeeded
(fee delta was already an exact 0.8600 SOL) — the failures decomposed into two
root causes, both real findings:

### Bug 1 (high): Umi clients read at `finalized` — 15–30 s of stale state

All Metaplex metadata reads (`fetchMetadataFromSeeds`) used
`createUmi(rpcUrl)` with Umi's default **`finalized`** commitment, while the
rest of the app reads at `confirmed`. On devnet the gap is small enough to
hide; on testnet it surfaced as:

- `/api/check-authority` → **404 on freshly created tokens** (metadata account not finalized yet) — a user opening the security checker right after creating a token would see "not found";
- `update-metadata` built a tx (200) **after the update authority was revoked** — expected 403; the stale read still showed the old authority. (No security impact — the on-chain program rejects the tx — but a paying user would sign a doomed transaction.)
- `check-authority` reported `isMutable: true` seconds after a make-immutable landed.

**Fix:** new [lib/solana/umi.ts](../lib/solana/umi.ts) — shared `getUmi()` pinned to `confirmed` — adopted by all five live call sites (`check-authority`, token-page cache, `buildUpdateMetadata`, `buildRevoke` ×2, `buildCreateToken`). Verified by runs 2/3: check-authority passes **0.3–0.6 s** after confirmation; the 403 negatives pass.

### Bug 2 (test harness): the suite outran the production rate limiter

Testnet confirmations (~5–8 s) made the driver hit the per-wallet confirm
limit (5/min) — nine 429s cascading into assertion failures. The limits are a
deliberate anti-abuse control and were **not** weakened; the e2e `api()` helper
now honors `Retry-After` and paces itself (visible as `[429 — pacing 60s]` in
run logs). `check-authority` steps also retry brief 404s — public RPC load
balancers can route a read to a node one slot behind.

### Additional fixes made during this phase

| # | Severity | Issue | Fix |
|---|---|---|---|
| 3 | medium | **Multisend platform fees were never journaled** — `multisend` was missing from the `/api/confirm` action enum and the multisender UI never called confirm. Fees were charged on-chain but invisible to `fee_events` accounting. | Enum + `MIN_FEE_LAMPORTS` entry (0.02 SOL/batch, server constants only); multisender sends a best-effort confirm per confirmed batch; e2e now asserts it for SPL + Token-2022 multisends. |
| 4 | medium | **Middleware CSRF Origin-fallback allowlist keyed on `NEXT_PUBLIC_SITE_URL`, which no env file defines.** On any deploy domain other than the hardcoded one, older browsers (no Fetch Metadata) would get 403s on every POST. | Allowlist now also honors `NEXT_PUBLIC_APP_URL` (the variable the templates actually define). |
| 5 | medium | **Live Helius API key committed in tracked `.env.local.example`** (git history since commit `a1424d2`). | Placeholder in the template. **Rotation still required** — the key remains in git history (blocker B1 in mainnet-readiness.md). |
| 6 | low | `apiError` mapped immutable-state errors to a generic 500 (latent: revoke-update on an immutable token); `buildUpdateMetadata`/make-immutable lacked `isMutable` guards, so those ops on an already-immutable token built doomed txs. | Guards added; narrow 403 mapping for our own immutable-state messages. |
| 7 | low | `refresh-wallets.mjs` defaulted to devnet RPC regardless of `.env.local` — `pnpm wallets:check`/`wallets:refresh` silently targeted the wrong cluster during a testnet session. | RPC default now: `--rpc` flag > `SOLANA_RPC_URL` in `.env.local` > devnet. |
| 8 | hygiene | E2E banner said "devnet" on testnet; no scripted page-coverage artifact existed. | Banner uses detected network; new `scripts/smoke-pages.mjs` (`pnpm test:smoke`, 36 assertions incl. TESTNET banner, OG content-type, sitemap/robots, 404s). |

---

## 3. Testnet-specific behavior verified (graceful degradation)

| Degradation | Expected on testnet | Observed |
|---|---|---|
| Helius DAS absent | Holdings fall back to plain RPC (mints + balances, no logos) | ✅ `GET /api/tokens/holdings` 200 with all created mints incl. Token-2022 |
| Birdeye absent | Price/volume/liquidity null → "—" rendering; risk flags still computed | ✅ token API returns `no_liquidity` + authority flags; page renders |
| No Postgres | Lists return `[]` + `X-DB-Degraded: 1`; `/api/confirm` verifies fee on-chain, `recorded:false`, never 500 | ✅ all four read-API steps + every confirm |
| Public RPC rate limits | Pacing/retries, no corrupted state | ✅ (run logs) |
| Cluster banner & explorer links | Amber TESTNET banner; `?cluster=testnet` | ✅ smoke assertion + token page link code |
| Startup guardrail | Mismatched network/RPC refuses to boot | ✅ (code-verified six combinations; live-verified in devnet phase) |

## 4. Fee integrity (on-chain, across the whole phase)

Every paid transaction includes a `SystemProgram.transfer` to the fee wallet
whose amount is derived **only** from server constants (`lib/solana/fees.ts`);
`/api/confirm` re-verifies the on-chain balance delta independently. Across all
four runs the fee wallet's balance moved by exactly the configured sum — not one
lamport more or less.

| Wallet | Phase start | After run 4 (final) | Delta |
|---|---|---|---|
| Payer (`CMK9…ee3`) | 9.5000 SOL | 5.2786 SOL | −4.2214 (fees + mint/ATA/metadata rent + network) |
| Fee wallet (`Ewe8…h5HL`) | 0.5000 SOL | 4.4100 SOL | **+3.9100 = 3 × 0.8600 + 1 × 1.3300, exact** |

- **Runs 2 & 3 (33-test suite): 0.8600 SOL each** = 3×create 0.30 + custom-creator 0.10 + creation-revokes 0.10 + 2×mint-more 0.10 + update-metadata 0.05 + revoke-update 0.05 + T22 revokes 0.10 + freeze/thaw 0.02 + 2×multisend 0.04.
- **Run 4 (45-test cross-product): 1.3300 SOL** = the 0.8600 base **+ 0.4700 gap-fill** (D: create 0.10 + mint 0.05 + freeze 0.01 + thaw 0.01 + revoke-freeze 0.05 + revoke-mint 0.05 + make-immutable 0; E: create 0.10 + update-metadata 0.05 + revoke-update 0.05).

Burn and make-immutable charged **0** on both standards, as advertised. The
multisend fee-journaling fix (issue #3) was confirmed end-to-end: each batch's
0.02 SOL is both collected on-chain and accepted by `/api/confirm` under the new
`multisend` action.

## 5. Coverage boundary — what scripts cannot sign off

The scripted suites cover the HTTP API, transaction building/signing, security
headers, CSRF, rate limits, uploads, and every page route — now for **every tool
on both token standards** (§1b). **Browser-wallet UI behaviors** (wallet popup
UX, BalanceCheck insufficient-funds rendering, CSV upload widget,
reject-in-wallet recovery, mid-flow disconnect, multisend tab-kill resume) are
the manual rows of [testnet-testing.md](testnet-testing.md) §5 — tracked as the
open **Testnet #2** sign-off row. None of them touch server code paths that the
scripted suites haven't already exercised; they are UI-glue around the API calls
proven above.

## 6. Artifacts added/changed this phase

| File | Change |
|---|---|
| `lib/solana/umi.ts` | new — shared `confirmed`-commitment Umi factory |
| `lib/solana/buildRevoke.ts`, `buildUpdateMetadata.ts`, `buildCreateToken.ts`, `lib/data/cache.ts`, `app/api/check-authority/route.ts` | use `getUmi()`; immutable-state guards |
| `app/api/confirm/route.ts` | `multisend` action (fee floor from server constant) |
| `app/tools/multisender/page.tsx` | per-batch best-effort fee confirm |
| `lib/api/errors.ts` | 403 mapping for immutable-state errors |
| `middleware.ts` | CSRF allowlist honors `NEXT_PUBLIC_APP_URL` |
| `scripts/refresh-wallets.mjs` | cluster inferred from `.env.local` |
| `scripts/test-e2e.mjs` | 429 pacing, 404 retry, network-correct banner, multisend confirms, **+ Token D (SPL) & Token E (T22) cross-product gap-fill → 45 tests** |
| `scripts/smoke-pages.mjs` + `pnpm test:smoke` | new — 36-assertion route smoke suite |
| `next.config.ts` | CSP `connect-src` auto-allows the configured `NEXT_PUBLIC_RPC_URL` origin + optional `CSP_CONNECT_SRC_EXTRA` — works with any RPC provider on mainnet (verified: a non-Solana host is added to the served header) |
| `.env.mainnet.example` | new — documented mainnet switch with checklist + `CSP_CONNECT_SRC_EXTRA` |
| `docs/deployment-mainnet.md` | new — full VPS launch guide: RPC/API providers (where/which/tier), Postgres/Redis, nginx+TLS, env reference, go-live checklist |
| `.env.local.example` | leaked Helius key replaced with placeholder |
| `docs/mainnet-readiness.md` | new — blockers, session script, accepted limitations |
| `docs/testnet-testing.md` | sign-off row Testnet #1 recorded |

## 7. Environment notes (this machine, unchanged from devnet phase)

TLS-intercepting proxy: app server runs with `NODE_TLS_REJECT_UNAUTHORIZED=0`
(dev only), scripts patch fetch; WebSocket confirms unusable → scripts poll
`getSignatureStatus` over HTTP. No Postgres; Redis via `pnpm dev:redis`.
Wallet funding: payer (wallet-1) holds ~5.3 testnet SOL after run 4 — enough for
~3 more full cross-product runs (~1.44 SOL each); `pnpm wallets:refresh` tops up
(testnet faucet permitting).
