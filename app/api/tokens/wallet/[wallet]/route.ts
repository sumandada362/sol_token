import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/db/redis";

interface TokenRow {
  mint: string;
  name: string | null;
  symbol: string | null;
  metadata_uri: string | null;
  standard: string;
  tx_signature: string;
  created_at: string;
}

// Wallet token lists are short-lived — they change whenever the user creates a token
const WALLET_LIST_TTL = 300; // 5 minutes

export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;

  if (!wallet || wallet.length < 32) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const cacheKey = CACHE_KEYS.walletTokens(wallet);

  // Redis-first
  const cached = await cacheGet<TokenRow[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  // Postgres fallback — degrade to an empty list if the datastore is down
  // (the on-chain state is the source of truth; this list is convenience data)
  try {
    const rows = await query<TokenRow>(
      "SELECT mint, name, symbol, metadata_uri, standard, tx_signature, created_at FROM tokens WHERE creator_wallet = $1 ORDER BY created_at DESC",
      [wallet]
    );
    await cacheSet(cacheKey, rows, WALLET_LIST_TTL);
    return NextResponse.json(rows, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    console.error("[tokens/wallet] datastore unavailable:", err);
    return NextResponse.json([], {
      headers: { "X-Cache": "MISS", "X-DB-Degraded": "1" },
    });
  }
}
