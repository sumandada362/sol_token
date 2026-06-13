import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import type { Umi } from "@metaplex-foundation/umi";

/**
 * Umi client pinned to "confirmed" commitment, matching getConnection().
 * Umi's default is "finalized", which lags confirmed state by ~15-30s — long
 * enough that a metadata account created or revoked moments ago looks
 * missing/unchanged to authority checks (404s on fresh mints, missing 403s
 * after revokes).
 */
export function getUmi(): Umi {
  return createUmi(process.env.SOLANA_RPC_URL!, { commitment: "confirmed" }).use(
    mplTokenMetadata()
  );
}
