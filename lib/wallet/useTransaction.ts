"use client";
import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, type Connection } from "@solana/web3.js";

/**
 * Confirm a signature by HTTP polling instead of connection.confirmTransaction().
 *
 * Why: all RPC goes through our /api/rpc proxy, which is HTTP-only. web3.js's
 * confirmTransaction() opens a WebSocket (signatureSubscribe); with no WS it would
 * hang until the blockhash expires and then throw a FALSE "expired" — even for a
 * tx that actually landed. Polling getSignatureStatuses over HTTP is correct here.
 */
async function pollConfirmation(
  connection: Connection,
  signature: string,
  lastValidBlockHeight: number,
): Promise<void> {
  const TIMEOUT_MS = 90_000;
  const start = Date.now();

  while (Date.now() - start < TIMEOUT_MS) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const st = value[0];
    if (st) {
      if (st.err) throw new Error(`Transaction failed: ${JSON.stringify(st.err)}`);
      if (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized") return;
    }

    // Blockhash-expiry check: if the chain has advanced past the tx's last valid
    // block height and the signature still isn't known, it will never land.
    try {
      const height = await connection.getBlockHeight("confirmed");
      if (height > lastValidBlockHeight) {
        const { value: recheck } = await connection.getSignatureStatuses([signature]);
        const s2 = recheck[0];
        if (s2?.err) throw new Error(`Transaction failed: ${JSON.stringify(s2.err)}`);
        if (s2 && (s2.confirmationStatus === "confirmed" || s2.confirmationStatus === "finalized")) return;
        throw new Error("Transaction expired before it was confirmed. Please try again.");
      }
    } catch (e) {
      if (e instanceof Error && /failed|expired/i.test(e.message)) throw e;
      // transient RPC hiccup on the height check — keep polling
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  throw new Error("Timed out waiting for confirmation. Check the transaction signature on an explorer.");
}

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
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: true,
        maxRetries: 3,
      });

      onState("confirming");
      // HTTP polling (proxy is WS-less) — throws on on-chain error or expiry.
      await pollConfirmation(connection, sig, lastValidBlockHeight);

      onState("confirmed");

      if (onConfirmed) await onConfirmed(sig).catch(console.error);

      return { signature: sig };
    },
    [signTransaction, publicKey, connection]
  );

  return { execute, connected: !!publicKey, publicKey };
}
