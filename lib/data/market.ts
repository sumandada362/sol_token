const BIRDEYE_BASE = "https://public-api.birdeye.so";

function birdeyeHeaders() {
  return {
    "X-API-KEY": process.env.BIRDEYE_API_KEY ?? "",
    Accept: "application/json",
  };
}

export interface TokenOverview {
  price: number | null;
  priceChange24hPct: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  supply: number | null;
}

/**
 * Token price, volume, liquidity, market cap overview.
 * Cached at call site — this is the expensive Birdeye call.
 */
export async function getTokenOverview(mint: string): Promise<TokenOverview> {
  const empty: TokenOverview = { price: null, priceChange24hPct: null, volume24h: null, liquidity: null, marketCap: null, supply: null };
  try {
    const res = await fetch(`${BIRDEYE_BASE}/defi/token_overview?address=${mint}`, {
      headers: birdeyeHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return empty;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any;
    const d = json?.data ?? {};
    return {
      price: d.price ?? null,
      priceChange24hPct: d.priceChange24hPercent ?? null,
      volume24h: d.v24hUSD ?? null,
      liquidity: d.liquidity ?? null,
      marketCap: d.mc ?? null,
      supply: d.supply ?? null,
    };
  } catch {
    return empty;
  }
}

/**
 * Check if a token has an active liquidity pool via Birdeye.
 */
export async function hasLiquidityPool(mint: string): Promise<boolean> {
  try {
    const res = await fetch(`${BIRDEYE_BASE}/defi/token_overview?address=${mint}`, {
      headers: birdeyeHeaders(),
    });
    if (!res.ok) return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any;
    const liq = json?.data?.liquidity;
    return typeof liq === "number" && liq > 0;
  } catch {
    return false;
  }
}
