# Runbook: RPC Provider Outage

**Symptoms:** All transaction-building API routes return 500 or time out. Token pages fail to load on-chain data. The `/api/token/[mint]` endpoint is slow or erroring.

## Immediate response (< 5 minutes)

1. **Confirm the outage** — try `curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`. If your primary RPC is down and this returns OK, the issue is your provider, not Solana itself.

2. **Flip to backup RPC** — update the `SOLANA_RPC_URL` environment variable in Vercel to your secondary RPC URL, then redeploy (Vercel → Settings → Environment Variables → Edit → Redeploy).

   **Primary:** `SOLANA_RPC_URL=<your primary provider URL>`
   **Backup:** `SOLANA_RPC_URL=<your backup provider URL>`

3. **Verify recovery** — after redeploy, test `/api/tx/burn` with a valid request. If it returns a transaction (even a dummy one that would fail on-chain), the RPC connection is back.

## Backup RPC options

| Provider | Free tier | Notes |
|----------|-----------|-------|
| Helius | Yes | helius.dev |
| QuickNode | Yes | quicknode.com |
| Alchemy | Yes | alchemy.com |
| Public Solana | Limited | api.mainnet-beta.solana.com — do not use in production under load |

## If all RPCs are down

Solana mainnet itself may be degraded. Monitor https://status.solana.com. Post a status update on your status page. There is nothing to do except wait — do not issue manual transactions.

## Recovery checklist

- [ ] `SOLANA_RPC_URL` updated in Vercel
- [ ] Redeploy triggered and green
- [ ] Test transaction build succeeds
- [ ] Status page updated ("operational" once resolved)
- [ ] Check if any transactions were stuck during outage (users may have unsigned txs with expired block heights — they need to retry)
