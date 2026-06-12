import { NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { PublicKey } from "@solana/web3.js";

export async function GET(_req: Request, { params }: { params: Promise<{ wallet: string }> }) {
  const { wallet } = await params;
  try { new PublicKey(wallet); } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const rows = await query<{
      action: string;
      lamports: number;
      signature: string;
      mint: string | null;
      created_at: string;
    }>(
      "SELECT action, lamports, signature, mint, created_at FROM fee_events WHERE wallet = $1 ORDER BY created_at DESC LIMIT 100",
      [wallet]
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[wallet/fees] datastore unavailable:", err);
    return NextResponse.json([], { headers: { "X-DB-Degraded": "1" } });
  }
}
