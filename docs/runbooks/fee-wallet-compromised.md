# Runbook: Fee Wallet Compromise

**Symptoms:** Unauthorized transactions from the fee wallet address. Unexpected SOL movements. Alert from wallet monitoring service.

## STOP — do this first

If you believe the fee wallet is actively being drained:

1. **The fee wallet is hot — you cannot pause it on-chain.** But you can stop new fees being sent to it by deploying immediately with a new fee wallet.

2. **Do not send more SOL to the compromised wallet.**

## Rotate the fee wallet (< 15 minutes)

### Step 1 — Create a new wallet

Generate a new Solana keypair using a hardware wallet (Ledger) or a fresh cold wallet. **Do not reuse any existing hot wallet.** Record the new public key.

### Step 2 — Update environment variables

In Vercel → Settings → Environment Variables:
- Update `FEE_WALLET_ADDRESS` to the new public key
- Do NOT update the private key here — the fee wallet is receive-only from the app's perspective. The app only needs the public address.

### Step 3 — Redeploy

Trigger an immediate redeploy in Vercel. After deploy, all new fee transactions will go to the new address.

### Step 4 — Sweep old wallet

If any SOL remains in the compromised wallet, sweep it to a safe address immediately using whatever access you still have.

### Step 5 — Audit

- Check `fee_events` table for any anomalous patterns (very high lamport values, unexpected actions) that may indicate the compromise was exploited to forge fee confirmations — not just drain SOL.
- Check if `FEE_WALLET_ADDRESS` was ever exposed in git history: `git log --all -- .env*`.

### Step 6 — Notify users (if applicable)

If the compromise affected user transactions or data, notify users. This is a regulatory consideration — discuss with counsel.

## Recovery checklist

- [ ] New fee wallet created (hardware wallet preferred)
- [ ] `FEE_WALLET_ADDRESS` updated in Vercel
- [ ] Redeploy completed and tested
- [ ] Old wallet swept
- [ ] `fee_events` audited for anomalies
- [ ] Git history checked for secret exposure
- [ ] Counsel notified if user impact
