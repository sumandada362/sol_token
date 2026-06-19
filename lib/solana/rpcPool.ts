import { Connection } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Umi } from "@metaplex-foundation/umi";
import { RPC_ENDPOINTS, type RpcEndpoint } from "@/app_configs/integrations";

/**
 * Server-side RPC rotation pool — the "independent script" the app calls to get
 * an RPC every time one is needed. SERVER-ONLY (it reads the secret URLs from
 * app_configs/integrations.ts → RPC_ENDPOINTS). Never import this from a
 * "use client" component.
 *
 * Why a module and not a literal background loop / separate OS process: the
 * rotation has to share one counter with the running web server. A separate
 * process can't share that state, and an interval timer would just spin without
 * doing anything useful. Instead the cursor advances on demand — every time the
 * app leases an RPC — which is what actually spreads the load. This module's
 * top-level code runs once, when the server first imports it (i.e. at startup),
 * which is where the config is validated.
 *
 * The "if 1 RPC vs 2+ RPCs" rule lives in leaseRpc():
 *   • 1 endpoint  → always return it, cursor untouched (no rotation overhead).
 *   • 2+ endpoints→ round-robin, advancing the cursor each lease.
 */

// Local-dev TLS escape hatch (previously in connection.ts; kept here so every
// pooled Connection benefits). On some machines/proxies Node can't verify a
// provider's certificate chain (UNABLE_TO_VERIFY_LEAF_SIGNATURE), surfacing as
// intermittent "network error" on server RPC calls. Opt in locally with
// DEV_INSECURE_TLS=1. Double-gated to non-production so it can never weaken TLS
// on a deployed server.
if (process.env.DEV_INSECURE_TLS === "1" && process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

// Cross-cluster guardrail — catch a mainnet/devnet RPC mismatch at startup
// rather than silently sending real transactions to the wrong cluster. Applied
// to EVERY configured endpoint (the old single-URL check generalised to the pool).
function assertClusterMatches(url: string, tag: string): void {
  const isMainnet = /mainnet/.test(url);
  const isDevnet = /devnet/.test(url);
  const isTestnet = /testnet/.test(url);

  if (NETWORK === "mainnet-beta" && (isDevnet || isTestnet)) {
    throw new Error(
      `[guardrail] RPC "${tag}" points at a test cluster but NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta. Fix app_configs/integrations.ts.`
    );
  }
  if (NETWORK !== "mainnet-beta" && isMainnet) {
    throw new Error(
      `[guardrail] RPC "${tag}" contains "mainnet" but NEXT_PUBLIC_SOLANA_NETWORK=${NETWORK}. Fix app_configs/integrations.ts.`
    );
  }
  if (NETWORK === "testnet" && isDevnet) {
    throw new Error(
      `[guardrail] RPC "${tag}" is devnet but NEXT_PUBLIC_SOLANA_NETWORK=testnet. Fix app_configs/integrations.ts.`
    );
  }
  if (NETWORK === "devnet" && isTestnet) {
    throw new Error(
      `[guardrail] RPC "${tag}" is testnet but NEXT_PUBLIC_SOLANA_NETWORK=devnet. Fix app_configs/integrations.ts.`
    );
  }
}

// Validate the pool once, at import (startup). Drop blank entries, then enforce
// "at least one", unique tags, and per-endpoint cluster sanity.
const _pool: RpcEndpoint[] = RPC_ENDPOINTS.filter((e) => e.url && e.url.trim() !== "");

if (_pool.length === 0) {
  throw new Error(
    `[rpcPool] No RPC endpoints configured. Add at least one { tag, url } to RPC_ENDPOINTS in app_configs/integrations.ts.`
  );
}

const _seenTags = new Set<string>();
for (const e of _pool) {
  if (_seenTags.has(e.tag)) {
    throw new Error(`[rpcPool] Duplicate RPC tag "${e.tag}" in app_configs/integrations.ts — tags must be unique.`);
  }
  _seenTags.add(e.tag);
  assertClusterMatches(e.url, e.tag);
}

// Round-robin cursor — the rotation "loop". Each lease advances it and wraps,
// so consecutive transactions cycle A → B → C → A → … across the pool.
let _cursor = 0;

// One Connection per endpoint, built lazily and reused (Connection is a thin,
// shareable RPC client). Umi is NOT cached: builders mutate it with
// signerIdentity(), so each caller needs its own instance.
const _connections = new Map<string, Connection>();

/** How many RPCs are configured. 1 ⇒ callers can skip rotation entirely. */
export function rpcCount(): number {
  return _pool.length;
}

function endpointByTag(tag: string): RpcEndpoint {
  const e = _pool.find((x) => x.tag === tag);
  if (!e) {
    throw new Error(`[rpcPool] No RPC configured with tag "${tag}". Check app_configs/integrations.ts.`);
  }
  return e;
}

/**
 * Lease an RPC endpoint ({ tag, url }).
 *
 *   • With a tag → returns THAT endpoint (sticky). Pass the tag you got from an
 *     earlier lease to keep a whole transaction on the same RPC — e.g. when a
 *     build needs both getConnection() and getUmi() on one endpoint.
 *   • Without a tag:
 *       – 1 endpoint configured  → returns it; the cursor is NOT advanced.
 *       – 2+ endpoints configured → returns the next one round-robin and advances.
 */
export function leaseRpc(tag?: string): RpcEndpoint {
  if (tag) return endpointByTag(tag);
  if (_pool.length === 1) return _pool[0];
  const endpoint = _pool[_cursor % _pool.length];
  _cursor = (_cursor + 1) % _pool.length;
  return endpoint;
}

/** A reusable Connection for a specific endpoint URL (cached per URL). */
export function connectionFor(url: string): Connection {
  let conn = _connections.get(url);
  if (!conn) {
    conn = new Connection(url, "confirmed");
    _connections.set(url, conn);
  }
  return conn;
}

/**
 * A fresh Umi client for a specific endpoint URL, pinned to "confirmed" (matching
 * the Connections). Not cached: callers mutate it via signerIdentity(), so a
 * shared instance would race across concurrent requests.
 */
export function umiFor(url: string): Umi {
  return createUmi(url, { commitment: "confirmed" }).use(mplTokenMetadata());
}
