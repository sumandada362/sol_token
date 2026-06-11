import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { PublicKey } from "@solana/web3.js";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet") ?? "";

  try { new PublicKey(wallet); } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const rows = await query<{ mint: string; expires_at: string; starts_at: string }>(
    `SELECT DISTINCT ON (mint) mint, starts_at, expires_at
     FROM subscriptions
     WHERE wallet = $1 AND expires_at > now()
     ORDER BY mint, expires_at DESC`,
    [wallet]
  );

  return NextResponse.json(rows);
}
