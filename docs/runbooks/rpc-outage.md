# Runbook: RPC Provider Outage

**Symptoms:** All transaction-building API routes return 500 or time out. Token pages fail to load on-chain data. The `/api/token/[mint]` endpoint is slow or erroring.

## Immediate response (< 5 minutes)

1. **Confirm the outage** — try `curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'`. If your primary RPC is down and this returns OK, the issue is your provider, not Solana itself.

2. **Flip to / add a backup RPC** — server RPC endpoints live in the rotation pool in `app_configs/integrations.ts` (`RPC_ENDPOINTS`), not in an env var. Edit that list and redeploy:

   - **Remove or replace** the dead provider's `{ tag, url }` entry, **or**
   - **Add** a healthy provider as a new entry (e.g. `{ tag: "B", url: "<backup provider URL>" }`). With 2+ entries the pool round-robins automatically, so a second healthy endpoint also halves the load on the survivor.

   ```ts
   export const RPC_ENDPOINTS: RpcEndpoint[] = [
     // { tag: "A", url: "<dead primary>" },   // ← comment out / remove the down one
     { tag: "B", url: "<your backup provider URL>" },
   ];
   ```

   Then rebuild + redeploy. The startup guardrail (`lib/solana/rpcPool.ts`) refuses to boot if an endpoint's cluster doesn't match `NEXT_PUBLIC_SOLANA_NETWORK`, so a wrong-cluster paste fails fast instead of silently.

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

- [ ] `RPC_ENDPOINTS` in `app_configs/integrations.ts` updated (dead provider removed/replaced)
- [ ] Redeploy triggered and green
- [ ] Test transaction build succeeds
- [ ] Status page updated ("operational" once resolved)
- [ ] Check if any transactions were stuck during outage (users may have unsigned txs with expired block heights — they need to retry)
