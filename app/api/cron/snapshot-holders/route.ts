import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { getTotalHolderCount, getTopHolders, getMintSupply } from "@/lib/data/holders";
import { enrichTop10WithPoolFlag } from "@/lib/data/risk";

// Vercel cron calls with Authorization: Bearer <CRON_SECRET>
function authenticate(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all mints that have an active subscription
  const activeMints = await query<{ mint: string }>(
    "SELECT DISTINCT mint FROM subscriptions WHERE expires_at > now()"
  );

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  let snapshotted = 0;
  const errors: string[] = [];

  for (const { mint } of activeMints) {
    try {
      const [holderCount, topHolders, supply] = await Promise.all([
        getTotalHolderCount(mint),
        getTopHolders(mint),
        getMintSupply(mint),
      ]);

      let top10Pct = 0;
      if (supply > BigInt(0) && topHolders.length > 0) {
        const withOwners = topHolders.slice(0, 10).map((h) => ({
          address: h.address,
          owner: h.owner,
          pct: Number((h.amount * BigInt(10000) / supply)) / 100,
        }));
        const enriched = enrichTop10WithPoolFlag(withOwners);
        top10Pct = enriched.filter((h) => !h.isPool).reduce((s, h) => s + h.pct, 0);
      }

      await query(
        `INSERT INTO holder_snapshots (mint, day, holders, top10_pct)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (mint, day) DO UPDATE SET holders = EXCLUDED.holders, top10_pct = EXCLUDED.top10_pct`,
        [mint, today, holderCount ?? 0, top10Pct]
      );
      snapshotted++;
    } catch (e) {
      errors.push(`${mint}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, snapshotted, errors, date: today });
}
