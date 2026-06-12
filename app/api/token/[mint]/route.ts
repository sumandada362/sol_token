import { NextRequest, NextResponse } from "next/server";
import { getTokenPageData } from "@/lib/data/cache";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> }
) {
  const { mint } = await params;
  if (!mint || mint.length < 32) {
    return NextResponse.json({ error: "Invalid mint address" }, { status: 400 });
  }

  const limited = await rateLimit(req, RATE_LIMITS.general);
  if (limited) return limited;

  try {
    const data = await getTokenPageData(mint);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    return apiError(err, "token/mint");
  }
}
