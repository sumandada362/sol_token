"use client";
import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";

export type TxState =
  | "idle"
  | "building"
  | "sign"
  | "submitting"
  | "confirming"
  | "confirmed"
  | "failed";

export interface TxResult {
  signature: string;
}

interface ExecuteOptions {
  /** Called each time the state advances */
  onState: (state: TxState) => void;
  /** For create-token: keypair the client generated for the mint account */
  mintKeypair?: import("@solana/web3.js").Keypair;
  /** Called after on-chain confirmation so the caller can POST to /api/confirm */
  onConfirmed?: (sig: string) => Promise<void>;
}

/**
 * Returned by a build function — base64 transaction + block height for
 * the confirmTransaction strategy.
 */
export interface BuildResult {
  tx: string;
  lastValidBlockHeight: number;
}

export function useTransaction() {
  const { signTransaction, publicKey } = useWallet();
  const { connection } = useConnection();

  const execute = useCallback(
    async (buildFn: () => Promise<BuildResult>, opts: ExecuteOptions): Promise<TxResult> => {
      const { onState, mintKeypair, onConfirmed } = opts;

      if (!signTransaction || !publicKey) throw new Error("Wallet not connected");

      onState("building");
      const { tx: base64, lastValidBlockHeight } = await buildFn();

      onState("sign");
      const txBytes = Buffer.from(base64, "base64");
      const tx = Transaction.from(txBytes);

      // For create-token: mint keypair signs first (partial sign for the new account)
      if (mintKeypair) tx.partialSign(mintKeypair);

      const signed = await signTransaction(tx);

      onState("submitting");
      const blockhash = tx.recentBlockhash!;
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        maxRetries: 3,
      });

      onState("confirming");
      const result = await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      if (result.value.err) {
        onState("failed");
        throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
      }

      onState("confirmed");

      if (onConfirmed) await onConfirmed(sig).catch(console.error);

      return { signature: sig };
    },
    [signTransaction, publicKey, connection]
  );

  return { execute, connected: !!publicKey, publicKey };
}
