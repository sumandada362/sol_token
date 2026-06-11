import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { getTokenOverview } from "@/lib/data/market";

function authenticate(req: NextRequest): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: NextRequest) {
  if (!authenticate(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Current hour bucket (truncated to hour)
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const bucket = now.toISOString();

  // Get all active subscription mints
  const activeMints = await query<{ mint: string }>(
    "SELECT DISTINCT mint FROM subscriptions WHERE expires_at > now()"
  );

  let aggregated = 0;
  const errors: string[] = [];

  for (const { mint } of activeMints) {
    try {
      // Aggregate token_events for this hour
      const eventStats = await query<{
        tx_count: string;
        buys: string;
        sells: string;
        volume: string;
      }>(
        `SELECT
           count(*)::text AS tx_count,
           count(*) FILTER (WHERE kind = 'swap' AND amount > 0)::text AS buys,
           count(*) FILTER (WHERE kind = 'swap' AND amount < 0)::text AS sells,
           coalesce(sum(abs(amount)), 0)::text AS volume
         FROM token_events
         WHERE mint = $1
           AND ts >= $2::timestamptz
           AND ts < ($2::timestamptz + interval '1 hour')`,
        [mint, bucket]
      );

      // Pull current market data from Birdeye
      const overview = await getTokenOverview(mint);

      const stats = eventStats[0];
      await query(
        `INSERT INTO token_metrics_hourly (mint, bucket, price, volume, liquidity, holders, tx_count, buys, sells)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (mint, bucket) DO UPDATE SET
           price     = EXCLUDED.price,
           volume    = COALESCE(EXCLUDED.volume, token_metrics_hourly.volume),
           liquidity = EXCLUDED.liquidity,
           tx_count  = EXCLUDED.tx_count,
           buys      = EXCLUDED.buys,
           sells     = EXCLUDED.sells`,
        [
          mint,
          bucket,
          overview.price,
          overview.volume24h ?? parseFloat(stats?.volume ?? "0"),
          overview.liquidity,
          null, // holders filled by snapshot cron
          parseInt(stats?.tx_count ?? "0"),
          parseInt(stats?.buys ?? "0"),
          parseInt(stats?.sells ?? "0"),
        ]
      );
      aggregated++;
    } catch (e) {
      errors.push(`${mint}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({ ok: true, aggregated, errors, bucket });
}
