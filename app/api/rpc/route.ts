import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { leaseRpc } from "@/lib/solana/rpcPool";
import { rateLimit } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

/**
 * Browser RPC proxy — the ONLY way the frontend talks to Solana.
 *
 * The browser sends standard JSON-RPC here; this route asks the RPC controller
 * (lib/solana/rpcPool → leaseRpc) which endpoint to use and forwards the call,
 * then returns the provider's response verbatim. The keyed provider URL never
 * leaves the server, so there is NO RPC key in the client bundle at all.
 *
 * Abuse controls (it's an open POST endpoint):
 *   • method allowlist — only the JSON-RPC methods the app actually needs.
 *   • per-IP rate limit.
 *   • same-origin enforced in middleware.ts (CSRF / Fetch-Metadata).
 * Node runtime (rpcPool is server-only and reads secret config).
 */
export const runtime = "nodejs";

// JSON-RPC methods the browser legitimately needs (reads + submit/confirm).
// Anything else is rejected so this can't be used as a free general-purpose RPC.
const ALLOWED_METHODS = new Set<string>([
  "getBalance",
  "getLatestBlockhash",
  "getBlockHeight",
  "getSignatureStatuses",
  "sendTransaction",
  "simulateTransaction",
  "getAccountInfo",
  "getMultipleAccounts",
  "getMinimumBalanceForRentExemption",
  "getFeeForMessage",
  "getTokenAccountBalance",
  "getTokenAccountsByOwner",
  "getSignaturesForAddress",
  "getSlot",
  "getEpochInfo",
  "getVersion",
  "getGenesisHash",
  "getRecentPrioritizationFees",
]);

const RPC_LIMIT = { namespace: "rpc", limit: 240, windowSeconds: 60 };

function methodOf(x: unknown): string | null {
  if (!x || typeof x !== "object") return null;
  const m = (x as { method?: unknown }).method;
  return typeof m === "string" ? m : null;
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RPC_LIMIT);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate every call (single request or JSON-RPC batch) against the allowlist.
  const calls = Array.isArray(body) ? body : [body];
  if (calls.length === 0 || calls.length > 25) {
    return NextResponse.json({ error: "Empty or oversized batch" }, { status: 400 });
  }
  for (const c of calls) {
    const m = methodOf(c);
    if (!m || !ALLOWED_METHODS.has(m)) {
      return NextResponse.json({ error: `RPC method not allowed: ${m ?? "(none)"}` }, { status: 403 });
    }
  }

  try {
    // Ask the RPC controller which endpoint to use for this call, then forward.
    // Each call leases the next endpoint, so a multi-call flow naturally spreads
    // across the pool (the keyed URL stays server-side).
    const { url } = leaseRpc();
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000), // don't hang on a flaky provider
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.ok ? 200 : 502,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (err) {
    return apiError(err, "rpc-proxy");
  }
}
