# QA Matrix — Phase 4 Launch Evidence

Run on devnet first. Re-run critical column on mainnet with own funds before launch.
Record: tester name, date, browser/device, and outcome (✅ pass / ❌ fail / ⚠️ partial).

---

## B1. Functional matrix

Legend: ✅ pass | ❌ fail | ⚠️ partial | — not tested

| Flow | Happy path | Reject sig | Low SOL | Network drop mid-flow | Invalid input |
|---|---|---|---|---|---|
| Create SPL | | | | | |
| Create Token-2022 | | | | | |
| Create + all revocations | | | | | |
| Pool create (Raydium CPMM) | | | | | |
| Pool add liquidity | | | | | |
| Pool remove liquidity | | | | | |
| Burn tokens | | | | | |
| Mint more tokens | | | | | |
| Update metadata | | | | | |
| Revoke mint authority | | | | | |
| Revoke freeze authority | | | | | |
| Make immutable | | | | | |
| OpenBook market create | | | | | |
| Multisend (100 recipients) | | | | | |
| Multisend resume after kill | | | — | — |

Every cell must resolve to a defined UI state — no infinite spinners, no blank screens, every failure shows a next action.

---

## B2. Wallet matrix

| Wallet | Extension (desktop) | Mobile in-app browser |
|--------|--------------------|-----------------------|
| Phantom | | |
| Solflare | | |
| Backpack | | |

Test each wallet × each critical flow (create, pool, revoke).
**Mobile in-app browsers are where flows break most — test there first.**

---

## B3. Data-quality QA

| Check | Expected | Actual | Pass? |
|-------|----------|--------|-------|
| BONK on security checker: mint revoked, freeze revoked | Both green | | |
| Fresh honest token (yours): all revoked | All green | | |
| Token with active mint authority: flagged | Orange warning | | |
| Top-10 concentration > 80%: flagged | High risk indicator | | |
| Pool vault excluded from whale math | Vault not in top holders | | |
| Analytics holder count ± Birdeye (same time) | < 5% delta | | |
| Cost summary == actual on-chain cost (10 txs) | Exact match | | |

---

## B4. Performance

| Page | Target | Actual (Lighthouse mobile) | Pass? |
|------|--------|---------------------------|-------|
| Home | LCP < 2.5s, score ≥ 90 | | |
| /create-token | score ≥ 90 | | |
| /token/[mint] | TTFB < 500ms (ISR hit) | | |
| /blog/how-to-create-solana-token | score ≥ 90 | | |
| /docs/create-token | score ≥ 90 | | |

Load test: `k6 run --vus 50 --duration 10m scripts/load-test-api.js`
- [ ] Zero 5xx during run
- [ ] RPC credit burn within budget

---

## B5. Security spot-checks (from Track A adversarial pass)

Run these manually or with a test script before launch:

| Test | Expected | Pass? |
|------|----------|-------|
| POST /api/tx/create-token with fee:0.001 in body | Fee ignored; server uses FEES.createToken | |
| POST /api/tx/create-token 21× in 60s from same IP | 21st request returns 429 | |
| POST /api/confirm with replayed signature | Second request returns 200 (idempotent) but no duplicate DB row | |
| POST /api/upload with SVG file | 400 "Only PNG, JPG, and WebP" | |
| POST /api/upload with 3MB PNG | 400 "File exceeds 2 MB" | |
| POST /api/upload with filename `../../etc/passwd` | 400 "Invalid file name" | |
| POST /api/tx/* from cross-origin (different domain) | 403 Forbidden (CSRF check) | |
| GET /og?title=<script>alert(1)</script> | OG image renders safely (no XSS) | |
| Any page: check X-Frame-Options header | DENY | |
| Any page: check Content-Security-Policy header | Present | |

---

## Sign-off checklist

- [ ] Full devnet regression pass #1 — date: ______ tester: ______
- [ ] Full devnet regression pass #2 — date: ______ tester: ______
- [ ] Critical column re-run on mainnet — date: ______ tester: ______
- [ ] Adversarial security pass — date: ______ tester: ______
- [ ] QA matrix archived with screenshots/recordings
