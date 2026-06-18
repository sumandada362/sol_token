import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { uploadFileToPinata, uploadMetadataToPinata } from "@/lib/ipfs/upload";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
// Path traversal / null-byte characters we never want in a filename
const UNSAFE_FILENAME_RE = /[\\/\0.]{2,}|^\.+$|%2[Ee]|%2[Ff]/;

// Magic-byte signatures for allowed image types (SVG and other text formats are excluded)
const MAGIC = [
  { bytes: [0x89, 0x50, 0x4e, 0x47], type: "image/png" },       // PNG
  { bytes: [0xff, 0xd8, 0xff], type: "image/jpeg" },             // JPEG
  { bytes: [0x52, 0x49, 0x46, 0x46], type: "image/webp" },       // RIFF (WebP container)
] as const;

function detectMimeByMagic(buffer: Buffer): string | null {
  for (const { bytes, type } of MAGIC) {
    if (bytes.every((b, i) => buffer[i] === b)) {
      // Extra check: WebP RIFF container must have "WEBP" at offset 8
      if (type === "image/webp") {
        const webpSig = buffer.slice(8, 12).toString("ascii");
        if (webpSig !== "WEBP") return null;
      }
      return type;
    }
  }
  return null;
}

// Strip all metadata fields to prevent injection through token name/description
function sanitizeText(s: string | null, maxLen = 200): string {
  if (!s) return "";
  return s.slice(0, maxLen).replace(/[\u0000-\u001f\u007f]/g, "");
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.upload);
  if (limited) return limited;

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const existingImageUrl = (form.get("imageUrl") as string | null)?.trim() ?? "";
    const nameField = sanitizeText(form.get("name") as string | null, 30);
    const descriptionField = sanitizeText(form.get("description") as string | null, 500);

    // Only accept https image URLs — never http: / javascript: / data: passed in.
    if (existingImageUrl && !existingImageUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Image URL must be an https:// URL" }, { status: 400 });
    }

    // Allow a metadata-only upload (no image) as long as there is something to
    // store — a name or description. This lets a token keep its description /
    // socials even when the creator didn't add a logo.
    if (!file && !existingImageUrl && !nameField && !descriptionField) {
      return NextResponse.json({ error: "Nothing to upload" }, { status: 400 });
    }

    let imageUri = existingImageUrl;

    if (file) {
      // Reject suspicious filenames (path traversal, null bytes, etc.)
      if (UNSAFE_FILENAME_RE.test(file.name)) {
        return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File exceeds 2 MB limit" }, { status: 400 });
      }

      // Validate by magic bytes — never trust the Content-Type header or file extension
      const bytes = Buffer.from(await file.arrayBuffer());
      const detectedType = detectMimeByMagic(bytes);
      if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
        return NextResponse.json(
          { error: "Only PNG, JPG, and WebP images are allowed" },
          { status: 400 }
        );
      }

      imageUri = await uploadFileToPinata(file);
    }

    const metadata = {
      name: nameField,
      symbol: sanitizeText(form.get("symbol") as string | null, 10),
      description: descriptionField || undefined,
      image: imageUri,
      extensions: {
        ...(form.get("website") ? { website: sanitizeText(form.get("website") as string, 200) } : {}),
        ...(form.get("twitter") ? { twitter: sanitizeText(form.get("twitter") as string, 100) } : {}),
        ...(form.get("telegram") ? { telegram: sanitizeText(form.get("telegram") as string, 100) } : {}),
      },
      // Custom creator info add-on — shown as the token's creator on explorers
      ...(form.get("creatorName")
        ? {
            creator: {
              name: sanitizeText(form.get("creatorName") as string, 50),
              ...(form.get("creatorWebsite") ? { site: sanitizeText(form.get("creatorWebsite") as string, 200) } : {}),
            },
          }
        : {}),
    };

    const metadataUri = await uploadMetadataToPinata(metadata);
    return NextResponse.json({ metadataUri, imageUri });
  } catch (err) {
    return apiError(err, "upload");
  }
}
