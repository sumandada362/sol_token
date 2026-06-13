# Runbook: Helius Webhook Outage

**Symptoms:** Token analytics, holder snapshots, or subscription events are not updating. The Helius webhook dashboard shows failed deliveries or no traffic.

## What the webhook does

Helius sends POST requests to `/api/webhooks/helius` for:
- New token transactions (holder tracking)
- Subscription payment confirmations

If the webhook is down, these events queue up in Helius but are not processed by the app.

## Immediate response

1. **Check Helius dashboard** — log into helius.dev → Webhooks. Check the delivery status and error log for your webhook endpoint.

2. **Check the endpoint is reachable** — `curl -X POST https://solanatoken.app/api/webhooks/helius -H "Content-Type: application/json" -d '{}'`. You should get a 401 (unauthorized) or 400 (bad payload) — a 5xx means the endpoint itself is broken.

3. **If the endpoint is down** — check Vercel function logs for the webhook route. A deployment issue or env var missing (`HELIUS_WEBHOOK_SECRET`) would cause failures here.

## Catch-up after outage

Helius retries failed webhooks automatically for a period. Once your endpoint is restored:

1. Check the Helius retry queue — go to helius.dev → Webhooks → Failed → Retry All.

2. For gaps that exceed Helius's retry window, manually catch up missed events:

```
// Pseudo-code for manual catch-up
const signatures = await connection.getSignaturesForAddress(
  tokenMintPubkey,
  { until: lastKnownSignature }
);
for (const sig of signatures) {
  // Process each missed transaction manually
}
```

This is a known gap — add the catch-up script to `/scripts/catchup.ts` as a one-time tool.

## Recovery checklist

- [ ] Helius webhook endpoint verified reachable
- [ ] `HELIUS_WEBHOOK_SECRET` env var confirmed set in Vercel
- [ ] Failed deliveries retried in Helius dashboard
- [ ] Manual catch-up run if retry window was exceeded
- [ ] Holder counts and analytics verified correct for affected tokens

