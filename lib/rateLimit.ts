import { getRedis } from "@/lib/db/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export interface RateLimitConfig {
  /** Identifier namespace (e.g. "tx", "upload") */
  namespace: string;
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

/** Extract a best-effort client IP from the request. */
function getIp(req: NextRequest | Request): string {
  const headers = req.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

function buildLimitedResponse(config: RateLimitConfig, now: number): NextResponse {
  const windowMs = config.windowSeconds * 1000;
  return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(config.windowSeconds),
      "X-RateLimit-Limit": String(config.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(Math.ceil((now + windowMs) / 1000)),
    },
  });
}

async function slidingWindow(identifier: string, config: RateLimitConfig): Promise<NextResponse | null> {
  const key = `rl:${config.namespace}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  try {
    const redis = getRedis();
    const pipe = redis.pipeline();
    pipe.zremrangebyscore(key, 0, now - windowMs);
    pipe.zcard(key);
    pipe.zadd(key, now, `${now}-${Math.random()}`);
    pipe.expire(key, config.windowSeconds * 2);
    const results = await pipe.exec();

    const count = (results?.[1]?.[1] as number) ?? 0;
    if (count >= config.limit) return buildLimitedResponse(config, now);
    return null;
  } catch {
    // Redis unavailable — fail open rather than blocking legitimate users
    return null;
  }
}

/**
 * Sliding-window rate limiter by client IP.
 * Returns null if within limits; returns a 429 NextResponse if exceeded.
 */
export async function rateLimit(
  req: NextRequest | Request,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  return slidingWindow(getIp(req), config);
}

/**
 * Sliding-window rate limiter by an arbitrary key (e.g. wallet address).
 * Returns null if within limits; returns a 429 NextResponse if exceeded.
 */
export async function rateLimitByKey(
  identifier: string,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  return slidingWindow(identifier, config);
}

// Pre-configured limiters for each sensitive surface
export const RATE_LIMITS = {
  /** Transaction building — 20 requests per minute per IP */
  tx: { namespace: "tx", limit: 20, windowSeconds: 60 },
  /** File upload — 10 per minute per IP */
  upload: { namespace: "upload", limit: 10, windowSeconds: 60 },
  /** Confirm endpoint — 30 per minute per IP (replay attempts) */
  confirm: { namespace: "confirm", limit: 30, windowSeconds: 60 },
  /** General API — 100 per minute per IP */
  general: { namespace: "general", limit: 100, windowSeconds: 60 },
  /** Confirm endpoint — 5 per minute per wallet (prevents scripted wallet abuse) */
  walletConfirm: { namespace: "wconfirm", limit: 5, windowSeconds: 60 },
  /** Tx building — 10 per minute per wallet */
  walletTx: { namespace: "wtx", limit: 10, windowSeconds: 60 },
} satisfies Record<string, RateLimitConfig>;
