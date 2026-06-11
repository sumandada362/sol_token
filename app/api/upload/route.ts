import { NextResponse } from "next/server";
import { uploadFileToPinata, uploadMetadataToPinata } from "@/lib/ipfs/upload";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// Magic-byte signatures for allowed image types
const MAGIC = [
  { bytes: [0x89, 0x50, 0x4e, 0x47], type: "image/png" },
  { bytes: [0xff, 0xd8, 0xff], type: "image/jpeg" },
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "image/webp" }, // RIFF header
];

function detectMimeByMagic(buffer: Buffer): string | null {
  for (const { bytes, type } of MAGIC) {
    if (bytes.every((b, i) => buffer[i] === b)) return type;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const name = (form.get("name") as string | null) ?? "";
    const symbol = (form.get("symbol") as string | null) ?? "";
    const description = (form.get("description") as string | null) ?? "";
    const website = (form.get("website") as string | null) ?? "";
    const twitter = (form.get("twitter") as string | null) ?? "";
    const telegram = (form.get("telegram") as string | null) ?? "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 });
    }

    // Validate by magic bytes, not extension
    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedType = detectMimeByMagic(bytes);
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return NextResponse.json({ error: "Only PNG, JPG, and WebP images are allowed" }, { status: 400 });
    }

    // Upload image
    const imageUri = await uploadFileToPinata(file);

    // Build and upload metadata JSON
    const metadata = {
      name,
      symbol,
      description: description || undefined,
      image: imageUri,
      extensions: {
        ...(website ? { website } : {}),
        ...(twitter ? { twitter } : {}),
        ...(telegram ? { telegram } : {}),
      },
    };

    const metadataUri = await uploadMetadataToPinata(metadata);
    return NextResponse.json({ metadataUri, imageUri });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
