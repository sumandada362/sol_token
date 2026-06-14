import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  getMint,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { getConnection } from "./connection";
import { assertSimulates } from "./simulate";
import { getMintProgramId } from "./program";
import { feeIx, FEES } from "./fees";

export interface FreezeAccountsInput {
  payer: string;
  mint: string;
  wallets: string[];
  type: "freeze" | "thaw";
}

export async function buildFreezeAccountsTx(input: FreezeAccountsInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mint);

  const programId = await getMintProgramId(connection, mint);
  const mintInfo = await getMint(connection, mint, "confirmed", programId);
  if (!mintInfo.freezeAuthority || mintInfo.freezeAuthority.toBase58() !== payer.toBase58()) {
    throw new Error("Caller is not the freeze authority");
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  for (const wallet of input.wallets) {
    const walletPk = new PublicKey(wallet);
    const ata = getAssociatedTokenAddressSync(mint, walletPk, false, programId);
    const ix = input.type === "freeze"
      ? createFreezeAccountInstruction(ata, mint, payer, [], programId)
      : createThawAccountInstruction(ata, mint, payer, [], programId);
    tx.add(ix);
  }

  const totalFee = FEES.freezeAccount * input.wallets.length;
  const fee = feeIx(payer, totalFee);
  if (fee) tx.add(fee);

  await assertSimulates(connection, tx, "freeze-accounts");
  return tx;
}
