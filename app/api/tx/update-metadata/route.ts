import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateMetadataSchema } from "@/lib/solana/validate";
import { buildUpdateMetadataTx } from "@/lib/solana/buildUpdateMetadata";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.tx);
  if (limited) return limited;

  try {
    const body = updateMetadataSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const tx = await buildUpdateMetadataTx(body.data);
    const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
    const lastValidBlockHeight = tx.lastValidBlockHeight ?? 0;

    return NextResponse.json({ tx: serialized, lastValidBlockHeight });
  } catch (err) {
    return apiError(err, "tx/update-metadata");
  }
}
