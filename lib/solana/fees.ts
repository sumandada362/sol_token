import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from "@solana/web3.js";

export const FEES = {
  createToken: 0.1,
  customCreator: 0.1,
  mintMore: 0.05,
  updateMetadata: 0.05,
  revokeMint: 0.05,
  revokeFreeze: 0.05,
  revokeUpdate: 0.05,
  makeImmutable: 0,
  burn: 0,
  freezeAccount: 0.01,
} as const;

let _feeWallet: PublicKey | null = null;

/**
 * Validated platform fee wallet. Throws a clear error when FEE_WALLET_ADDRESS is
 * missing or malformed — otherwise `new PublicKey(undefined)` / a bad address
 * builds a malformed transfer instruction that the wallet reports only as the
 * opaque "Failed to simulate the results."
 */
function feeWallet(): PublicKey {
  if (_feeWallet) return _feeWallet;
  const addr = process.env.FEE_WALLET_ADDRESS;
  if (!addr) {
    throw new Error("FEE_WALLET_ADDRESS is not set — configure the platform fee wallet.");
  }
  try {
    _feeWallet = new PublicKey(addr);
  } catch {
    throw new Error(`FEE_WALLET_ADDRESS is not a valid Solana address: "${addr}"`);
  }
  return _feeWallet;
}

export function feeIx(payer: PublicKey, feeSol: number): TransactionInstruction | null {
  if (feeSol <= 0) return null;
  return SystemProgram.transfer({
    fromPubkey: payer,
    toPubkey: feeWallet(),
    lamports: Math.round(feeSol * LAMPORTS_PER_SOL),
  });
}
