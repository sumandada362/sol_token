import { PublicKey, Transaction } from "@solana/web3.js";
import { createBurnInstruction } from "@solana/spl-token";
import { getConnection } from "./connection";
import { getMintProgramId } from "./program";
import { feeIx, FEES } from "./fees";
import type { BurnInput } from "./validate";

export async function buildBurnTx(input: BurnInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mint);
  const tokenAccount = new PublicKey(input.tokenAccount);

  const programId = await getMintProgramId(connection, mint);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const ix = createBurnInstruction(tokenAccount, mint, payer, BigInt(input.amount), [], programId);
  const fee = feeIx(payer, FEES.burn);

  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });
  tx.add(ix);
  if (fee) tx.add(fee);

  return tx;
}
