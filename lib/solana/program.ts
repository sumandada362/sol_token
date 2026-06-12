import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

/**
 * Resolves which token program owns a mint (classic SPL Token or Token-2022).
 * Every management builder must pass this through — hardcoding TOKEN_PROGRAM_ID
 * silently breaks all operations on Token-2022 mints.
 */
export async function getMintProgramId(
  connection: Connection,
  mint: PublicKey
): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint, "confirmed");
  if (!info) throw new Error("Mint account not found");
  if (info.owner.equals(TOKEN_PROGRAM_ID)) return TOKEN_PROGRAM_ID;
  if (info.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  throw new Error("Account is not a token mint");
}
