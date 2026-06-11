import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";

function authenticate(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find mints whose last active subscription just expired (within past 24h)
  // but have no other still-active subscription.
  const justExpired = await query<{ mint: string }>(
    `SELECT DISTINCT s.mint
     FROM subscriptions s
     WHERE s.expires_at BETWEEN now() - interval '24 hours' AND now()
       AND NOT EXISTS (
         SELECT 1 FROM subscriptions s2
         WHERE s2.mint = s.mint AND s2.expires_at > now()
       )`
  );

  const deregistered: string[] = [];
  const errors: string[] = [];

  for (const { mint } of justExpired) {
    try {
      await deregisterHeliusWebhook(mint);
      deregistered.push(mint);
    } catch (e) {
      errors.push(`${mint}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Clean up expired nonces (older than 10 minutes — generous buffer)
  await query("DELETE FROM auth_nonces WHERE expires_at < now() - interval '10 minutes'").catch(() => undefined);

  return NextResponse.json({ ok: true, deregistered, errors });
}

async function deregisterHeliusWebhook(mint: string) {
  const apiKey = process.env.HELIUS_API_KEY;
  if (!apiKey) return;

  // List all webhooks and find the one(s) watching this mint
  const listRes = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`);
  if (!listRes.ok) return;

  const webhooks = await listRes.json() as Array<{ webhookID: string; accountAddresses: string[] }>;
  for (const wh of webhooks) {
    if (wh.accountAddresses.includes(mint)) {
      // Remove only this mint from the address list; delete if empty
      const remaining = wh.accountAddresses.filter((a) => a !== mint);
      if (remaining.length === 0) {
        await fetch(`https://api.helius.xyz/v0/webhooks/${wh.webhookID}?api-key=${apiKey}`, { method: "DELETE" });
      } else {
        await fetch(`https://api.helius.xyz/v0/webhooks/${wh.webhookID}?api-key=${apiKey}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountAddresses: remaining }),
        });
      }
    }
  }
}
