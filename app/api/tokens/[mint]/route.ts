import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db/postgres";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/db/redis";

interface TokenRow {
  mint: string;
  creator_wallet: string;
  name: string | null;
  symbol: string | null;
  metadata_uri: string | null;
  standard: string;
  fee_paid_lamports: number;
  tx_signature: string;
  created_at: string;
}

export async function GET(_req: Request, { params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;

  if (!mint || mint.length < 32) {
    return NextResponse.json({ error: "Invalid mint address" }, { status: 400 });
  }

  // Redis-first
  const cached = await cacheGet<TokenRow>(CACHE_KEYS.token(mint));
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Postgres fallback
  let row: TokenRow | null;
  try {
    row = await queryOne<TokenRow>(
      "SELECT * FROM tokens WHERE mint = $1",
      [mint]
    );
  } catch (err) {
    console.error("[tokens/mint] datastore unavailable:", err);
    return NextResponse.json({ error: "Token record temporarily unavailable" }, { status: 503 });
  }

  if (!row) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  // Backfill cache
  await cacheSet(CACHE_KEYS.token(mint), row);

  return NextResponse.json(row, {
    headers: { "X-Cache": "MISS" },
  });
}
