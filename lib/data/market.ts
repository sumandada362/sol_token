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

export interface OHLCVPoint {
  unixTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
 * OHLCV candles for the analytics chart.
 * type: "1H" | "1D" | "1W" — maps to Birdeye resolution.
 */
export async function getOHLCV(
  mint: string,
  resolution: "15m" | "1H" | "4H" | "1D",
  limit = 168
): Promise<OHLCVPoint[]> {
  try {
    const timeFrom = Math.floor(Date.now() / 1000) - limit * resolutionSeconds(resolution);
    const url = `${BIRDEYE_BASE}/defi/ohlcv?address=${mint}&type=${resolution}&time_from=${timeFrom}&time_to=${Math.floor(Date.now() / 1000)}`;
    const res = await fetch(url, { headers: birdeyeHeaders() });
    if (!res.ok) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (json?.data?.items ?? []).map((item: any) => ({
      unixTime: item.unixTime,
      open: item.o,
      high: item.h,
      low: item.l,
      close: item.c,
      volume: item.v,
    }));
  } catch {
    return [];
  }
}

function resolutionSeconds(r: string): number {
  const map: Record<string, number> = { "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400 };
  return map[r] ?? 3600;
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
