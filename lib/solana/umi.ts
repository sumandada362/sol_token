import type { Umi } from "@metaplex-foundation/umi";
import { leaseRpc, umiFor } from "./rpcPool";

/**
 * Umi client pinned to "confirmed" commitment, matching getConnection().
 * Umi's default is "finalized", which lags confirmed state by ~15-30s — long
 * enough that a metadata account created or revoked moments ago looks
 * missing/unchanged to authority checks (404s on fresh mints, missing 403s
 * after revokes).
 *
 * Pass the tag from an earlier leaseRpc()/getConnection() lease so the Umi
 * client uses the SAME RPC as the rest of the transaction (sticky rotation).
 * With no tag it leases the next RPC from the pool on its own.
 */
export function getUmi(tag?: string): Umi {
  return umiFor(leaseRpc(tag).url);
}
