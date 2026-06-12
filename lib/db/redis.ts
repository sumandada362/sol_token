import Redis from "ioredis";

let _client: Redis | null = null;

export function getRedis(): Redis {
  if (!_client) {
    _client = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    _client.on("error", (err) => {
      // Log but don't crash — cache misses are tolerable
      console.error("[redis]", err.message);
    });
  }
  return _client;
}

const DEFAULT_TTL = 86_400; // 24 hours

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await getRedis().del(key);
  } catch {
    // Non-fatal
  }
}

export const CACHE_KEYS = {
  token: (mint: string) => `token:${mint}`,
  walletTokens: (wallet: string) => `tokens:wallet:${wallet}`,
  walletHoldings: (wallet: string) => `holdings:wallet:${wallet}`,
  tokenLogo: (mint: string) => `logo:${mint}`,
  tokenPage: (mint: string) => `tokenpage:${mint}`,
};
