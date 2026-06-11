import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  getMint,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getConnection } from "./connection";
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

  const mintInfo = await getMint(connection, mint);
  if (!mintInfo.freezeAuthority || mintInfo.freezeAuthority.toBase58() !== payer.toBase58()) {
    throw new Error("Caller is not the freeze authority");
  }

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  for (const wallet of input.wallets) {
    const walletPk = new PublicKey(wallet);
    const ata = getAssociatedTokenAddressSync(mint, walletPk, false, TOKEN_PROGRAM_ID);
    const ix = input.type === "freeze"
      ? createFreezeAccountInstruction(ata, mint, payer)
      : createThawAccountInstruction(ata, mint, payer);
    tx.add(ix);
  }

  const totalFee = FEES.freezeAccount * input.wallets.length;
  const fee = feeIx(payer, totalFee);
  if (fee) tx.add(fee);

  return tx;
}
