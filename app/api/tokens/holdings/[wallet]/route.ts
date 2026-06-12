import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { getConnection } from "@/lib/solana/connection";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/db/redis";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { isSafeExternalUrl } from "@/lib/safeUrl";

export interface WalletHolding {
  mint: string;
  symbol: string;
  name: string;
  logo: string;
  amount: number;
  decimals: number;
}

// Holdings change with every transfer — keep the cache short
const HOLDINGS_TTL = 60;

interface DasAsset {
  id: string;
  content?: {
    json_uri?: string;
    metadata?: { name?: string; symbol?: string };
    links?: { image?: string };
    files?: { uri?: string; cdn_uri?: string }[];
  };
  token_info?: { balance?: number; decimals?: number; symbol?: string };
}

/** ipfs:// and ar:// URIs don't load in an <img> — rewrite to public gateways. */
function normalizeAssetUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.slice(7)}`;
  if (url.startsWith("ar://")) return `https://arweave.net/${url.slice(5)}`;
  return url;
}

// How many missing logos we resolve from off-chain JSON per request
const LOGO_LOOKUP_CAP = 12;

/** Helius DAS — returns symbol/name/logo in a single call. Null if unavailable. */
async function fetchViaDas(wallet: string): Promise<WalletHolding[] | null> {
  try {
    const res = await fetch(process.env.SOLANA_RPC_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "holdings",
        method: "searchAssets",
        params: {
          ownerAddress: wallet,
          tokenType: "fungible",
          page: 1,
          limit: 200,
          options: { showZeroBalance: false },
        },
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: { items?: DasAsset[] } };
    const items = json.result?.items;
    if (!items) return null;

    const holdings = items
      .filter((a) => (a.token_info?.balance ?? 0) > 0)
      .map((a) => {
        const decimals = a.token_info?.decimals ?? 0;
        return {
          mint: a.id,
          symbol: a.token_info?.symbol ?? a.content?.metadata?.symbol ?? "",
          name: a.content?.metadata?.name ?? "",
          logo: normalizeAssetUrl(
            a.content?.links?.image ?? a.content?.files?.[0]?.cdn_uri ?? a.content?.files?.[0]?.uri
          ),
          amount: (a.token_info?.balance ?? 0) / 10 ** decimals,
          decimals,
          jsonUri: normalizeAssetUrl(a.content?.json_uri),
        };
      });

    // DAS often hasn't indexed an image for fresh tokens — pull it from the
    // off-chain metadata JSON instead. Resolved logos are cached per mint so
    // the slow lookup happens at most once per token, not per request.
    await Promise.all(
      holdings
        .filter((h) => !h.logo && h.jsonUri && isSafeExternalUrl(h.jsonUri))
        .slice(0, LOGO_LOOKUP_CAP)
        .map(async (h) => {
          const logoKey = CACHE_KEYS.tokenLogo(h.mint);
          const cached = await cacheGet<string>(logoKey);
          if (cached !== null) {
            h.logo = cached;
            return;
          }
          try {
            const r = await fetch(h.jsonUri, { signal: AbortSignal.timeout(1500) });
            if (r.ok) {
              const meta = (await r.json()) as { image?: string; symbol?: string; name?: string };
              h.logo = normalizeAssetUrl(meta.image);
              if (!h.symbol && meta.symbol) h.symbol = meta.symbol;
              if (!h.name && meta.name) h.name = meta.name;
            }
          } catch {
            // off-chain fetch is best-effort
          }
          // Negative results are cached briefly too, so dead URIs don't slow every open
          await cacheSet(logoKey, h.logo, h.logo ? 86_400 : 3_600);
        })
    );

    return holdings.map((h) => ({
      mint: h.mint,
      symbol: h.symbol,
      name: h.name,
      logo: h.logo,
      amount: h.amount,
      decimals: h.decimals,
    }));
  } catch {
    return null;
  }
}

/** Plain RPC fallback — mints and balances only, no metadata. */
async function fetchViaRpc(wallet: string): Promise<WalletHolding[]> {
  const conn = getConnection();
  const owner = new PublicKey(wallet);
  const [spl, t22] = await Promise.all([
    conn.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID }),
    conn.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }).catch(() => ({ value: [] })),
  ]);

  const holdings: WalletHolding[] = [];
  for (const { account } of [...spl.value, ...t22.value]) {
    const info = account.data.parsed?.info;
    const ui: number = info?.tokenAmount?.uiAmount ?? 0;
    if (!info?.mint || ui <= 0) continue;
    holdings.push({
      mint: info.mint,
      symbol: "",
      name: "",
      logo: "",
      amount: ui,
      decimals: info.tokenAmount?.decimals ?? 0,
    });
  }
  return holdings;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ wallet: string }> }) {
  const limited = await rateLimit(req, RATE_LIMITS.general);
  if (limited) return limited;

  const { wallet } = await params;
  try {
    new PublicKey(wallet);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const cacheKey = CACHE_KEYS.walletHoldings(wallet);
  const cached = await cacheGet<WalletHolding[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const holdings = (await fetchViaDas(wallet)) ?? (await fetchViaRpc(wallet));
    holdings.sort((a, b) => b.amount - a.amount);

    await cacheSet(cacheKey, holdings, HOLDINGS_TTL);
    return NextResponse.json(holdings, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    console.error("[tokens/holdings]", err);
    return NextResponse.json({ error: "Failed to load wallet tokens" }, { status: 502 });
  }
}
