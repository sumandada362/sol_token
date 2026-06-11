import { NextResponse } from "next/server";
import { createTokenSchema } from "@/lib/solana/validate";
import { buildCreateTokenTx } from "@/lib/solana/buildCreateToken";

export async function POST(req: Request) {
  try {
    const body = createTokenSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }

    const tx = await buildCreateTokenTx(body.data);
    const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
    const lastValidBlockHeight = tx.lastValidBlockHeight ?? 0;

    return NextResponse.json({ tx: serialized, lastValidBlockHeight });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
