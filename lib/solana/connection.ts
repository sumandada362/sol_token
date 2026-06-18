import type { Connection } from "@solana/web3.js";
import { leaseRpc, connectionFor, rpcCount } from "./rpcPool";

// The RPC pool (lib/solana/rpcPool.ts) owns endpoint config, the TLS escape
// hatch, and the startup cluster guardrail — importing it here runs that
// validation at app start. Server-side RPC endpoints now live in
// app_configs/integrations.ts (RPC_ENDPOINTS), not in SOLANA_RPC_URL.
export { rpcCount };

/**
 * A ready-to-use server-side Connection.
 *
 *   • No tag → leases the next RPC from the pool: round-robin when 2+ endpoints
 *     are configured, or the single endpoint otherwise. Call this ONCE per
 *     transaction/request and reuse the returned object, so the whole flow stays
 *     on one endpoint (the "ask once, keep it for the transaction" model).
 *   • With a tag (from a prior leaseRpc()) → pins to that same endpoint. Use this
 *     when a transaction also needs getUmi() and both must hit the SAME RPC.
 */
export function getConnection(tag?: string): Connection {
  return connectionFor(leaseRpc(tag).url);
}
