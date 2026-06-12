# FORGE — Regression Checklist

Scripted ~30-minute pass. Run on devnet before every production deploy.
Re-run the ★ critical rows on mainnet with own funds before a major release.

**Setup**: `NEXT_PUBLIC_SOLANA_NETWORK=devnet`, DEV-CREATOR wallet funded with ≥2 devnet SOL.

---

## R1. Token creation ★

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 1.1 | Create SPL token: name "RTEST", symbol "RT", 9 decimals, 1 000 000 supply, logo | Token minted; mint address shown | |
| 1.2 | Create Token-2022 token: same params | Mint address different; labeled "Token-2022" on explorer | |
| 1.3 | Create SPL + revoke mint + revoke freeze in same flow | Both checked before signing; single transaction set | |
| 1.4 | Create with 0 supply (if allowed) | Either accepted or clear validation error | |
| 1.5 | Disconnect wallet mid-flow → reconnect | Flow resumes or restarts cleanly; no ghost state | |

---

## R2. Burn ★

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 2.1 | Burn 1 000 tokens from RT | Balance decreases; burn tx confirmed on devnet | |
| 2.2 | Burn more than balance | Validation error before signing | |

---

## R3. Mint more

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 3.1 | Mint 500 000 additional RT (requires active mint authority) | Supply increases by 500 000 | |
| 3.2 | Attempt mint after revoking mint authority | Button disabled or error: "Mint authority already revoked" | |

---

## R4. Update metadata ★

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 4.1 | Update description on RT | New description visible on /token/[mint] after cache flush | |
| 4.2 | Upload new logo (valid PNG < 2 MB) | Logo updates on /token/[mint] | |
| 4.3 | Upload SVG file | 400 "Only PNG, JPG, and WebP" | |

---

## R5. Revoke authorities ★

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 5.1 | Revoke mint authority on RT | Security checker shows mint ✓ revoked | |
| 5.2 | Revoke freeze authority on RT | Security checker shows freeze ✓ revoked | |
| 5.3 | Make immutable (revoke update authority) | Security checker shows update authority ✓ revoked | |

---

## R6. Multisend

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 6.1 | Upload CSV of 25 recipients (10 tokens each) | Preview table shows 25 rows; no validation errors | |
| 6.2 | Execute multisend | All 25 receive confirmed; summary shows 0 failures | |
| 6.3 | Upload malformed CSV (missing amount column) | Clear error; no tx built | |
| 6.4 | Kill tab mid-multisend → reopen → resume | Remaining batches sent; no duplicates | |

---

## R7. Security checker

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 7.1 | Check own fully-revoked token | All authorities show green | |
| 7.2 | Check a token with active mint authority | Orange warning flag | |
| 7.3 | Check BONK (mainnet — if applicable) | Mint revoked ✓, freeze revoked ✓ | |

---

## R8. Content & SEO

| # | Step | Expected | Pass? |
|---|------|----------|-------|
| 8.1 | GET /blog — page loads, featured cards visible | No blank content | |
| 8.2 | GET /blog/how-to-create-solana-token | MDX renders; TOC links work | |
| 8.3 | GET /docs/create-token | MDX renders; Fee badge shows "0.1 SOL" | |
| 8.4 | View page source on any page — check for `application/ld+json` | JSON-LD block present | |
| 8.5 | GET /og?title=Test — check response is an image | Returns `image/png`, no error | |
| 8.6 | GET /sitemap.xml | Blog and docs slugs present | |
| 8.7 | GET /robots.txt | /api/ disallowed; /blog/ allowed | |

---

## R9. Security hardening spot-checks

Run `pnpm dlx tsx scripts/test-adversarial.mts` — all tests must pass.

Manual checks:
- [ ] `curl -I https://your-domain/` shows `X-Frame-Options: DENY`
- [ ] `curl -I https://your-domain/` shows `Content-Security-Policy` header
- [ ] `curl -I https://your-domain/` shows `Strict-Transport-Security` header

---

## R10. Devnet environment checks

| # | Check | Expected | Pass? |
|---|-------|----------|-------|
| 10.1 | Devnet banner visible at top of page | Amber bar: "DEVNET — tokens have no real value" | |
| 10.2 | Wallet chip → "View on Solscan" link | URL contains `?cluster=devnet` | |
| 10.3 | Server startup log (check terminal) | No `[guardrail]` error thrown | |

---

## Sign-off

| Pass # | Date | Tester | Browser/Device | Notes |
|--------|------|--------|----------------|-------|
| Devnet #1 | | | | |
| Devnet #2 | | | | |
| Mainnet (★ rows only) | | | | |
