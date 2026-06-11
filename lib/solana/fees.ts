import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";

export const FEES = {
  createToken: 0.1,
  mintMore: 0.05,
  updateMetadata: 0.05,
  revokeMint: 0.05,
  revokeFreeze: 0.05,
  makeImmutable: 0,
  burn: 0,
  freezeAccount: 0.01,
} as const;

export function feeIx(payer: PublicKey, feeSol: number): TransactionInstruction | null {
  if (feeSol <= 0) return null;
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: new PublicKey(process.env.FEE_WALLET_ADDRESS!),
    lamports: Math.round(feeSol * LAMPORTS_PER_SOL),
  });
}
