import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createMintToInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { getConnection } from "./connection";
import { assertSimulates } from "./simulate";
import { getMintProgramId } from "./program";
import { feeIx, FEES } from "./fees";
import type { MintMoreInput } from "./validate";

export async function buildMintMoreTx(input: MintMoreInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mint);
  // `destination` is the recipient WALLET — the ATA is derived here so the
  // client never has to know about token accounts.
  const destinationWallet = new PublicKey(input.destination);

  const programId = await getMintProgramId(connection, mint);
  const mintInfo = await getMint(connection, mint, "confirmed", programId);
  if (!mintInfo.mintAuthority || mintInfo.mintAuthority.toBase58() !== payer.toBase58()) {
    throw new Error("Caller is not the mint authority");
  }

  const ata = getAssociatedTokenAddressSync(mint, destinationWallet, false, programId);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  // Idempotent: no-op if the ATA already exists, creates it (payer funds rent) if not
  tx.add(
    createAssociatedTokenAccountIdempotentInstruction(payer, ata, destinationWallet, mint, programId)
  );
  tx.add(createMintToInstruction(mint, ata, payer, BigInt(input.amount), [], programId));

  const fee = feeIx(payer, FEES.mintMore);
  if (fee) tx.add(fee);

  await assertSimulates(connection, tx, "mint-more");
  return tx;
}
