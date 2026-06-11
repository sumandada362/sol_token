import { NextResponse } from "next/server";
import { updateMetadataSchema } from "@/lib/solana/validate";
import { buildUpdateMetadataTx } from "@/lib/solana/buildUpdateMetadata";

export async function POST(req: Request) {
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
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("not the update authority") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
