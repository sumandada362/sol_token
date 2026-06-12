"use client";
import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

/**
 * Shows the connected wallet's SOL balance next to the estimated cost of the
 * pending action, with a warning when the balance can't cover it. Rendered
 * on every confirm/review step so users see this before signing.
 */
export default function BalanceCheck({ requiredSol }: { requiredSol: number }) {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  // Keyed by wallet so a stale balance from a previous wallet never renders
  const [balance, setBalance] = useState<{ wallet: string; sol: number } | null>(null);

  useEffect(() => {
    if (!publicKey) return;
    const wallet = publicKey.toBase58();
    let cancelled = false;
    connection
      .getBalance(publicKey)
      .then((lamports) => {
        if (!cancelled) setBalance({ wallet, sol: lamports / LAMPORTS_PER_SOL });
      })
      .catch(() => {
        // balance display is best-effort — render nothing on failure
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  if (!publicKey || balance?.wallet !== publicKey.toBase58()) return null;
  const sol = balance.sol;
  const insufficient = sol < requiredSol;

  return (
    <div className={`balance-check${insufficient ? " balance-check--insufficient" : ""}`}>
      <div className="balance-check-row">
        <span>Your balance</span>
        <span className="lp-mono">{sol.toFixed(4)} SOL</span>
      </div>
      <div className="balance-check-row">
        <span>Required for this action (est.)</span>
        <span className="lp-mono">~{requiredSol.toFixed(4)} SOL</span>
      </div>
      {insufficient && (
        <p className="balance-check-warn">
          ⚠ Insufficient SOL — top up your wallet with at least {(requiredSol - sol).toFixed(4)} SOL before signing.
        </p>
      )}
    </div>
  );
}
