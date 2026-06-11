import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { cacheDel, CACHE_KEYS } from "@/lib/db/redis";

interface HeliusEnhancedTx {
  signature: string;
  type: string;
  source: string;
  timestamp: number;
  tokenTransfers?: Array<{
    mint: string;
    fromUserAccount: string;
    toUserAccount: string;
    tokenAmount: number;
  }>;
  nativeTransfers?: Array<{ fromUserAccount: string; toUserAccount: string; amount: number }>;
  accountData?: Array<{ account: string; nativeBalanceChange: number; tokenBalanceChanges: unknown[] }>;
}

export async function POST(req: NextRequest) {
  // Authenticate Helius via shared secret header
  const authHeader = req.headers.get("authorization");
  if (authHeader !== process.env.WEBHOOK_AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let events: HeliusEnhancedTx[];
  try {
    events = await req.json() as HeliusEnhancedTx[];
    if (!Array.isArray(events)) events = [events];
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const errors: string[] = [];
  for (const event of events) {
    try {
      await processEvent(event);
    } catch (err) {
      errors.push(`${event.signature}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, processed: events.length, errors });
}

async function processEvent(event: HeliusEnhancedTx) {
  const transfers = event.tokenTransfers ?? [];

  for (const transfer of transfers) {
    const { mint, tokenAmount } = transfer;
    if (!mint) continue;

    const kind = classifyKind(event.type);

    // Idempotent insert — unique on signature (compound with mint for multi-mint txs)
    await query(
      `INSERT INTO token_events (signature, mint, kind, amount, ts, raw)
       VALUES ($1, $2, $3, $4, to_timestamp($5), $6)
       ON CONFLICT (signature) DO NOTHING`,
      [event.signature, mint, kind, tokenAmount, event.timestamp, JSON.stringify(event)]
    );

    // Invalidate the analytics cache for this mint
    await cacheDel(CACHE_KEYS.analytics(mint));
    // Invalidate token page cache (holder/liquidity data may have changed)
    await cacheDel(CACHE_KEYS.tokenPage(mint));
  }
}

function classifyKind(eventType: string): string {
  const t = eventType?.toUpperCase() ?? "";
  if (t.includes("SWAP") || t.includes("TRADE")) return "swap";
  if (t.includes("TRANSFER")) return "transfer";
  if (t.includes("BURN")) return "burn";
  if (t.includes("MINT")) return "mint";
  return "unknown";
}
