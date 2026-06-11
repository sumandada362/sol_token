import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { burnSchema } from "@/lib/solana/validate";
import { buildBurnTx } from "@/lib/solana/buildBurn";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.tx);
  if (limited) return limited;

  try {
    const body = burnSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const tx = await buildBurnTx(body.data);
    const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
    const lastValidBlockHeight = tx.lastValidBlockHeight ?? 0;

    return NextResponse.json({ tx: serialized, lastValidBlockHeight });
  } catch (err) {
    return apiError(err, "tx/burn");
  }
}
