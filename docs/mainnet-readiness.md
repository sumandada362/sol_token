# Solana Token — Mainnet Testing Readiness Checklist

Status as of 2026-06-13: **testnet phase passed** — full SPL×Token-2022
cross-product, 45/45 (see
[AUDIT-REPORT-TESTNET-2026-06-13.md](AUDIT-REPORT-TESTNET-2026-06-13.md), incl.
the §1b coverage matrix).
This document is the gate between testnet sign-off and the first mainnet
testing session.

## 1. What "mainnet testing" means here

A controlled session on `mainnet-beta` with a real (small) budget, before any
public launch: create one cheap token, run one of each paid flow, verify fee
accounting end-to-end with the production database, then tear down.
Expected real-SOL spend: ~0.7 SOL fees + ~0.05 SOL rent/network (most of which
returns to your own fee wallet).

**Step-by-step VPS deployment, RPC/API provider choices, nginx+TLS, and env
setup are in [deployment-mainnet.md](deployment-mainnet.md).** This file is the
readiness gate; that one is the launch procedure.

## 2. Hard blockers — do these before the session

| # | Item | Why / how |
|---|---|---|
| B1 | **Rotate the Helius API key** | The devnet key was committed to git history in `.env.local.example` (fixed in the working tree, but history retains it). Generate a new key in the Helius dashboard; use separate keys for server (`SOLANA_RPC_URL`) and anything browser-visible. |
| B2 | **Provision managed Postgres + Redis** | On test clusters the graceful-degradation paths are a feature; on mainnet they mean *rate limiting fails open* (no Redis) and *real fees go unjournaled* (no Postgres). Apply `db/schema.sql`, `db/002_phase2.sql`, `db/migrations/002_multisend_journal.sql`. |
| B3 | **Mainnet fee wallet on hardware** | `FEE_WALLET_ADDRESS` = public key of a hardware-wallet keypair. Never the testnet wallet (its mnemonic sits in plaintext in `scripts/testnet-wallets.*`). |
| B4 | **Fresh secrets** | `WEBHOOK_AUTH_SECRET`, `CRON_SECRET`: `openssl rand -hex 32`, set in the host's env manager (not committed). |
| B5 | **Configure env from `.env.mainnet.example`** | The startup guardrail throws on any network/RPC mismatch — a failed boot here is the guardrail working. |
| B6 | **HTTPS deployment** | HSTS only applies on the deployed HTTPS domain (verified header set in `next.config.ts`); confirm `curl -I https://<domain>` shows `Strict-Transport-Security`, `X-Frame-Options: DENY`, CSP. |

## 3. Mainnet test session script

1. `pnpm test:smoke` against the deployed URL (`BASE_URL=https://<domain>`).
2. Connect a dedicated mainnet test wallet funded with ~1.5 SOL.
3. Create one SPL token (0.1 SOL fee) → verify on Solscan (no `?cluster=` param on mainnet), holder count and market stats populate (Helius + Birdeye live).
4. One mint-more (0.05), one metadata update (0.05), one revoke (0.05), one 3-recipient multisend (0.02/batch), one freeze+thaw on a second wallet (0.01×2), burn (free), make-immutable (free).
5. After each paid action: `/api/confirm` must return `recorded: true`. **Any `recorded:false` with the production DB up is a launch blocker.**
6. Check `fee_events` rows match §4 of [testnet-testing.md](testnet-testing.md) fee schedule exactly; check the `multisend` action rows exist (new this phase).
7. Verify rate limiting: 21 rapid `POST /api/tx/create-token` → 429 (Redis live).
8. Run through `docs/runbooks/` once with the on-call person: bad deploy, RPC outage, webhook outage, fee-wallet compromise.

## 4. Known accepted limitations (sign-off context)

- **Multisend fee journaling is best-effort client-side.** Each batch fires
  `/api/confirm`; with >5 batches/min the per-wallet confirm limiter (5/min)
  drops the excess. Fees are still collected on-chain; reconciliation can
  re-derive them from the fee wallet's history. Acceptable for launch;
  consider a server-side reconciliation cron later.
- **`/token/[mint]` renders placeholders (not 404) for garbage mints** — no
  crash, soft-fail by design.
- **Pool / OpenBook market / Burn LP pages are "coming soon"** — no tx flow
  exposed (verified by smoke test).
- `reactStrictMode: false` pending a wallet-adapter upgrade.
- E2E/wallet scripts patch TLS verification for Windows corporate-proxy
  environments — scripts only, never the app server.

## 5. Evidence trail

| Artifact | Content |
|---|---|
| `scripts/testnet-e2e-results.json` | Final **45-test cross-product** run (every tool × SPL/Token-2022), mints A–E + signatures |
| `docs/AUDIT-REPORT-TESTNET-2026-06-13.md` | Testnet phase report (this phase) |
| `docs/AUDIT-REPORT-2026-06-12.md` | Devnet audit + 11 fixed bugs (previous phase) |
| `docs/testnet-testing.md` §7 | Sign-off table |
