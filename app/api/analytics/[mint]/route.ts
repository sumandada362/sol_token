import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, queryOne } from "@/lib/db/postgres";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/db/redis";
import { getTokenOverview, getOHLCV } from "@/lib/data/market";
import nacl from "tweetnacl";
import bs58 from "bs58";

const authSchema = z.object({
  wallet: z.string().min(32),
  nonce: z.string().min(1),
  signature: z.string().min(1), // base58-encoded Ed25519 signature
});

interface SubscriptionRow {
  id: number;
  expires_at: string;
}

interface HolderSnapshot {
  day: string;
  holders: number;
  top10_pct: number;
}

interface HourlyMetric {
  bucket: string;
  price: number;
  volume: number;
  liquidity: number;
  holders: number;
  tx_count: number;
  buys: number;
  sells: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params;
  if (!mint || mint.length < 32) {
    return NextResponse.json({ error: "Invalid mint" }, { status: 400 });
  }

  // Parse auth from query string
  const url = new URL(req.url);
  const rawAuth = {
    wallet: url.searchParams.get("wallet") ?? "",
    nonce: url.searchParams.get("nonce") ?? "",
    signature: url.searchParams.get("sig") ?? "",
  };

  const parsed = authSchema.safeParse(rawAuth);
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing auth parameters" }, { status: 401 });
  }

  const { wallet, nonce, signature } = parsed.data;

  // Verify nonce: must exist in DB, not expired, and belong to this wallet
  const nonceRow = await queryOne<{ wallet: string; expires_at: string }>(
    "SELECT wallet, expires_at FROM auth_nonces WHERE nonce = $1",
    [nonce]
  );

  if (!nonceRow || new Date(nonceRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Nonce invalid or expired" }, { status: 401 });
  }
  if (nonceRow.wallet !== wallet) {
    return NextResponse.json({ error: "Nonce wallet mismatch" }, { status: 401 });
  }

  // Verify Ed25519 signature — wallet signed the nonce message
  try {
    const message = new TextEncoder().encode(`FORGE auth: ${nonce}`);
    const sigBytes = bs58.decode(signature);
    const pubkeyBytes = bs58.decode(wallet);
    const valid = nacl.sign.detached.verify(message, sigBytes, pubkeyBytes);
    if (!valid) {
      return NextResponse.json({ error: "Signature invalid" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 401 });
  }

  // Consume nonce (single-use)
  await query("DELETE FROM auth_nonces WHERE nonce = $1", [nonce]);

  // Check subscription
  const sub = await queryOne<SubscriptionRow>(
    "SELECT id, expires_at FROM subscriptions WHERE mint = $1 AND wallet = $2 AND expires_at > now() ORDER BY expires_at DESC LIMIT 1",
    [mint, wallet]
  );

  // Overview is free for everyone
  const overview = await getTokenOverview(mint);

  if (!sub) {
    // Free tier — current snapshot only
    return NextResponse.json({
      tier: "free",
      overview,
      upsell: {
        message: "Unlock 1 year of analytics history, holder growth, CSV export, and more.",
        priceSol: 0.5,
      },
    });
  }

  // Paid tier — check cache
  const cacheKey = CACHE_KEYS.analytics(mint);
  const cached = await cacheGet<object>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Fetch full history
  const [ohlcv, holderHistory, hourly] = await Promise.all([
    getOHLCV(mint, "1H", 720),
    query<HolderSnapshot>(
      "SELECT day, holders, top10_pct FROM holder_snapshots WHERE mint = $1 ORDER BY day DESC LIMIT 90",
      [mint]
    ),
    query<HourlyMetric>(
      "SELECT * FROM token_metrics_hourly WHERE mint = $1 ORDER BY bucket DESC LIMIT 720",
      [mint]
    ),
  ]);

  const payload = {
    tier: "paid",
    expiresAt: sub.expires_at,
    overview,
    ohlcv,
    holderHistory,
    hourly,
  };

  await cacheSet(cacheKey, payload, 300);
  return NextResponse.json(payload);
}

// ── Issue a nonce for wallet auth ──────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  await params; // mint not strictly needed for nonce but included for clarity

  const body = z.object({ wallet: z.string().min(32) }).safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  const nonce = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await query(
    "INSERT INTO auth_nonces (nonce, wallet, expires_at) VALUES ($1, $2, $3)",
    [nonce, body.data.wallet, expiresAt.toISOString()]
  );

  return NextResponse.json({ nonce, expiresAt: expiresAt.toISOString(), message: `FORGE auth: ${nonce}` });
}
