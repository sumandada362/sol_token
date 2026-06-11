import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "@/lib/solana/connection";
import { PublicKey } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";

export interface AuthorityInfo {
  name: string;
  symbol: string;
  uri: string;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  updateAuthority: string;
  isMutable: boolean;
  // off-chain metadata (best-effort, may be empty strings)
  description: string;
  image: string;
  website: string;
  twitter: string;
  telegram: string;
}

interface OffChainMeta {
  description?: string;
  image?: string;
  extensions?: { website?: string; twitter?: string; telegram?: string };
  properties?: { links?: { website?: string; twitter?: string; telegram?: string } };
}

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  if (!mint || mint.length < 32) {
    return NextResponse.json({ error: "Invalid mint address" }, { status: 400 });
  }

  try {
    const conn = getConnection();
    const mintPk = new PublicKey(mint);

    const [mintInfo, metadata] = await Promise.all([
      conn.getParsedAccountInfo(mintPk, "confirmed"),
      (async () => {
        const umi = createUmi(process.env.SOLANA_RPC_URL!).use(mplTokenMetadata());
        return fetchMetadataFromSeeds(umi, { mint: umiPublicKey(mint) });
      })(),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (mintInfo.value?.data as any)?.parsed?.info;
    const mintAuthority: string | null = parsed?.mintAuthority ?? null;
    const freezeAuthority: string | null = parsed?.freezeAuthority ?? null;

    // Fetch off-chain JSON (best-effort)
    let offChain: OffChainMeta = {};
    if (metadata.uri) {
      try {
        const res = await fetch(metadata.uri, { signal: AbortSignal.timeout(4000) });
        if (res.ok) offChain = await res.json() as OffChainMeta;
      } catch { /* ignore — off-chain fetch is best-effort */ }
    }

    const links = offChain.extensions ?? offChain.properties?.links ?? {};

    const info: AuthorityInfo = {
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority,
      freezeAuthority,
      updateAuthority: metadata.updateAuthority,
      isMutable: metadata.isMutable,
      description: offChain.description ?? "",
      image: offChain.image ?? "",
      website: links.website ?? "",
      twitter: links.twitter ?? "",
      telegram: links.telegram ?? "",
    };

    return NextResponse.json(info, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[check-authority]", err);
    return NextResponse.json(
      { error: "Token not found or has no metadata." },
      { status: 404 }
    );
  }
}
