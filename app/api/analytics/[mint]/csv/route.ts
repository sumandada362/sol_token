import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db/postgres";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params;
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet") ?? "";

  if (!wallet || wallet.length < 32) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  // Verify active subscription (no full auth re-check needed — this is a download link
  // generated within an authenticated session; add HMAC token if stricter auth needed)
  const sub = await queryOne<{ id: number }>(
    "SELECT id FROM subscriptions WHERE mint = $1 AND wallet = $2 AND expires_at > now() LIMIT 1",
    [mint, wallet]
  );

  if (!sub) {
    return NextResponse.json({ error: "No active subscription" }, { status: 403 });
  }

  // Stream hourly metrics as CSV
  const rows = await query<{
    bucket: string;
    price: number | null;
    volume: number | null;
    liquidity: number | null;
    holders: number | null;
    tx_count: number | null;
    buys: number | null;
    sells: number | null;
  }>(
    `SELECT bucket, price, volume, liquidity, holders, tx_count, buys, sells
     FROM token_metrics_hourly
     WHERE mint = $1
     ORDER BY bucket ASC`,
    [mint]
  );

  const header = "timestamp,price,volume,liquidity,holders,tx_count,buys,sells\n";
  const lines = rows.map((r) =>
    [
      r.bucket,
      r.price ?? "",
      r.volume ?? "",
      r.liquidity ?? "",
      r.holders ?? "",
      r.tx_count ?? "",
      r.buys ?? "",
      r.sells ?? "",
    ].join(",")
  );

  const csv = header + lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${mint.slice(0, 8)}-analytics.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
