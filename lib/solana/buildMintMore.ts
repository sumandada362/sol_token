import { PublicKey, Transaction } from "@solana/web3.js";
import { createMintToInstruction, getMint } from "@solana/spl-token";
import { getConnection } from "./connection";
import { feeIx, FEES } from "./fees";
import type { MintMoreInput } from "./validate";

export async function buildMintMoreTx(input: MintMoreInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mint);
  const destination = new PublicKey(input.destination);

  const mintInfo = await getMint(connection, mint);
  if (!mintInfo.mintAuthority || mintInfo.mintAuthority.toBase58() !== payer.toBase58()) {
    throw new Error("Caller is not the mint authority");
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const ix = createMintToInstruction(mint, destination, payer, BigInt(input.amount));
  const fee = feeIx(payer, FEES.mintMore);

  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });
  tx.add(ix);
  if (fee) tx.add(fee);

  return tx;
}
