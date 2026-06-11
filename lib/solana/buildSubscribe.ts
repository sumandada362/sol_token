import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
import { getConnection } from "./connection";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
export const SUBSCRIPTION_SOL = 0.5;

function memoIx(text: string): TransactionInstruction {
  return new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(text, "utf-8"),
  });
}

export interface SubscribeInput {
  payer: string;
  mint: string;
}

/**
 * Builds a subscribe transaction:
 * - 0.5 SOL transfer to the fee wallet
 * - Memo instruction: sub:<mint>
 * The caller signs and broadcasts; /api/confirm-subscribe verifies server-side.
 */
export async function buildSubscribeTx(input: SubscribeInput): Promise<Transaction> {
  const conn = getConnection();
  const payer = new PublicKey(input.payer);
  const feeWallet = new PublicKey(process.env.FEE_WALLET_ADDRESS!);

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  tx.add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: feeWallet,
      lamports: Math.round(SUBSCRIPTION_SOL * LAMPORTS_PER_SOL),
    }),
    memoIx(`sub:${input.mint}`)
  );

  return tx;
}
