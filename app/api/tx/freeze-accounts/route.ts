import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { buildFreezeAccountsTx } from "@/lib/solana/buildFreezeAccounts";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

const pubkey = z.string().refine(
  (v) => { try { new PublicKey(v); return true; } catch { return false; } },
  { message: "Invalid Solana public key" }
);

const schema = z.object({
  payer: pubkey,
  mint: pubkey,
  wallets: z.array(pubkey).min(1).max(20),
  type: z.enum(["freeze", "thaw"]),
});

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.tx);
  if (limited) return limited;

  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const tx = await buildFreezeAccountsTx(body.data);
    const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
    const lastValidBlockHeight = tx.lastValidBlockHeight ?? 0;

    return NextResponse.json({ tx: serialized, lastValidBlockHeight });
  } catch (err) {
    return apiError(err, "tx/freeze-accounts");
  }
}
