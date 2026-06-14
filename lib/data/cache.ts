import { getPool } from "@/lib/db/postgres";
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/db/redis";
import { isSafeExternalUrl } from "@/lib/safeUrl";
import { getConnection } from "@/lib/solana/connection";
import { PublicKey } from "@solana/web3.js";
import { fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { getUmi } from "@/lib/solana/umi";
import { publicKey as umiPublicKey } from "@metaplex-foundation/umi";
import { getTopHolders, getTotalHolderCount, getMintSupply } from "./holders";
import { getTokenOverview, hasLiquidityPool } from "./market";
import { computeRiskFlags, enrichTop10WithPoolFlag } from "./risk";

export interface TokenPageData {
  mint: string;
  name: string | null;
  symbol: string | null;
  image: string | null;
  // Authorities
  mintAuthority: string | null;
  freezeAuthority: string | null;
  updateAuthority: string | null;
  isMutable: boolean;
  // Custom creator info (off-chain JSON `creator` field)
  creatorName: string | null;
  creatorWebsite: string | null;
  // Holder stats
  totalHolders: number | null;
  topHolderPct: number;
  top10Pct: number;
  top10: Array<{ address: string; pct: number; isPool: boolean }>;
  // Market
  price: number | null;
  priceChange24hPct: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  // Risk
  riskFlags: Array<{ id: string; label: string; severity: string }>;
  // Meta
  updatedAt: number; // unix ms
}

const STALE_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Read-through cache: Redis → Postgres token_cache → live fetch.
 * Returns assembled TokenPageData for the token page and API route.
 */
export async function getTokenPageData(mint: string): Promise<TokenPageData> {
  // 1. Redis fast path
  const redisKey = CACHE_KEYS.tokenPage(mint);
  const cached = await cacheGet<TokenPageData>(redisKey);
  if (cached && Date.now() - cached.updatedAt < STALE_MS) {
    return cached;
  }

  // 2. Postgres token_cache (best-effort — a down datastore must not break the page)
  try {
    const pool = getPool();
    const pgRow = await pool.query<{ data: TokenPageData; updated_at: Date }>(
      "SELECT data, updated_at FROM token_cache WHERE mint = $1",
      [mint]
    );
    if (pgRow.rows.length > 0) {
      const row = pgRow.rows[0];
      const age = Date.now() - new Date(row.updated_at).getTime();
      if (age < STALE_MS) {
        await cacheSet(redisKey, row.data, 600);
        return row.data;
      }
    }
  } catch (err) {
    console.error("[token-cache] postgres read failed, falling through to live fetch:", err);
  }

  // 3. Live fetch — assemble from Helius + Birdeye + RPC
  const data = await fetchLiveTokenPageData(mint);

  // Write back to both caches
  const upsertSql = `
    INSERT INTO token_cache (mint, data, updated_at)
    VALUES ($1, $2, now())
    ON CONFLICT (mint) DO UPDATE SET data = EXCLUDED.data, updated_at = now()
  `;
  await getPool().query(upsertSql, [mint, JSON.stringify(data)]).catch(() => undefined);
  await cacheSet(redisKey, data, 600);

  return data;
}

async function fetchLiveTokenPageData(mint: string): Promise<TokenPageData> {
  const conn = getConnection();
  const mintPk = new PublicKey(mint);

  // Fetch in parallel: mint info, metadata, top holders, supply, market overview
  const [mintInfo, metadataResult, topHoldersRaw, supply, overview] = await Promise.allSettled([
    conn.getParsedAccountInfo(mintPk, "confirmed"),
    fetchMetaplexMetadata(mint),
    getTopHolders(mint),
    getMintSupply(mint),
    getTokenOverview(mint),
  ]);

  // Parse mint authorities
  let mintAuthority: string | null = null;
  let freezeAuthority: string | null = null;
  if (mintInfo.status === "fulfilled" && mintInfo.value?.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (mintInfo.value.value.data as any)?.parsed?.info;
    mintAuthority = parsed?.mintAuthority ?? null;
    freezeAuthority = parsed?.freezeAuthority ?? null;
  }

  const meta = metadataResult.status === "fulfilled" ? metadataResult.value : null;
  const isMutable = meta?.isMutable ?? true;
  const name = meta?.name ?? null;
  const symbol = meta?.symbol ?? null;
  const image = meta?.image ?? null;
  const updateAuthority = meta?.updateAuthority ?? null;
  const creatorName = meta?.creatorName ?? null;
  const creatorWebsite = meta?.creatorWebsite ?? null;

  const holders = topHoldersRaw.status === "fulfilled" ? topHoldersRaw.value : [];
  const supplyVal = supply.status === "fulfilled" ? supply.value : BigInt(0);
  const market = overview.status === "fulfilled" ? overview.value : { price: null, priceChange24hPct: null, volume24h: null, liquidity: null, marketCap: null, supply: null };

  // Compute percentages — skip if supply is 0
  let top10Enriched: Array<{ address: string; pct: number; isPool: boolean }> = [];
  let topHolderPct = 0;
  let top10Pct = 0;

  if (supplyVal > BigInt(0)) {
    const withOwners = holders.slice(0, 10).map((h) => ({
      address: h.address,
      owner: h.owner,
      pct: Number((h.amount * BigInt(10000) / supplyVal)) / 100,
    }));
    top10Enriched = enrichTop10WithPoolFlag(withOwners);
    const nonPool = top10Enriched.filter((h) => !h.isPool);
    topHolderPct = nonPool[0]?.pct ?? 0;
    top10Pct = nonPool.reduce((s, h) => s + h.pct, 0);
  }

  const liq = market.liquidity ?? (await hasLiquidityPool(mint) ? 1 : 0);

  const riskFlags = computeRiskFlags(
    { mintAuthority, freezeAuthority, isMutable },
    { totalHolders: null, topHolder: top10Enriched[0] ? { address: top10Enriched[0].address, pct: topHolderPct } : null, top10Pct, top10: top10Enriched },
    { hasLiquidity: (liq ?? 0) > 0 }
  );

  // Fetch holder count async (can be slow — don't block the rest)
  const totalHolders = await getTotalHolderCount(mint).catch(() => null);

  return {
    mint,
    name,
    symbol,
    image,
    mintAuthority,
    freezeAuthority,
    updateAuthority,
    isMutable,
    creatorName,
    creatorWebsite,
    totalHolders,
    topHolderPct,
    top10Pct,
    top10: top10Enriched,
    price: market.price,
    priceChange24hPct: market.priceChange24hPct,
    volume24h: market.volume24h,
    liquidity: market.liquidity,
    marketCap: market.marketCap,
    riskFlags,
    updatedAt: Date.now(),
  };
}

interface MetaplexMeta {
  name: string | null;
  symbol: string | null;
  image: string | null;
  isMutable: boolean;
  updateAuthority: string | null;
  creatorName: string | null;
  creatorWebsite: string | null;
}

async function fetchMetaplexMetadata(mint: string): Promise<MetaplexMeta> {
  try {
    const metadata = await fetchMetadataFromSeeds(getUmi(), { mint: umiPublicKey(mint) });

    let image: string | null = null;
    let creatorName: string | null = null;
    let creatorWebsite: string | null = null;
    if (metadata.uri && isSafeExternalUrl(metadata.uri)) {
      try {
        const res = await fetch(metadata.uri, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json = await res.json() as { image?: string; creator?: { name?: string; site?: string } };
          image = json.image ?? null;
          creatorName = json.creator?.name ?? null;
          creatorWebsite = json.creator?.site ?? null;
        }
      } catch { /* off-chain fetch is best-effort */ }
    }

    return {
      name: metadata.name ?? null,
      symbol: metadata.symbol ?? null,
      image,
      isMutable: metadata.isMutable,
      updateAuthority: metadata.updateAuthority ? String(metadata.updateAuthority) : null,
      creatorName,
      creatorWebsite,
    };
  } catch {
    return { name: null, symbol: null, image: null, isMutable: true, updateAuthority: null, creatorName: null, creatorWebsite: null };
  }
}
