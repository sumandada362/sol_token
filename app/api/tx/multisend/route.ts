import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { buildMultisendTxs, validateRecipients, toRawUnits } from "@/lib/solana/buildMultisend";
import { rateLimit, rateLimitByKey, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

const pubkey = z.string().refine(
  (v) => { try { new PublicKey(v); return true; } catch { return false; } },
  { message: "Invalid Solana public key" }
);

const recipientSchema = z.object({
  address: pubkey,
  amount: z.string().regex(/^\d+(\.\d+)?$/, "Must be a positive decimal number"),
});

const schema = z.object({
  payer: pubkey,
  mint: pubkey,
  decimals: z.number().int().min(0).max(9),
  recipients: z.array(recipientSchema).min(1).max(10_000),
});

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.tx);
  if (limited) return limited;

  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const { payer, mint, decimals, recipients } = body.data;

    const walletLimited = await rateLimitByKey(payer, RATE_LIMITS.walletTx);
    if (walletLimited) return walletLimited;

    const errors = validateRecipients(recipients, decimals);
    if (errors.size > 0) {
      const errObj = Object.fromEntries([...errors.entries()].map(([k, v]) => [String(k), v]));
      return NextResponse.json({ error: "Recipient validation failed", rows: errObj }, { status: 400 });
    }

    const rawRecipients = recipients.map((r) => ({
      address: r.address,
      amount: toRawUnits(r.amount, decimals),
    }));

    const result = await buildMultisendTxs(payer, mint, decimals, rawRecipients);
    return NextResponse.json(result);
  } catch (err) {
    return apiError(err, "tx/multisend");
  }
}
