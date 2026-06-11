"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { parseError } from "@/lib/wallet/parseError";

export default function BurnPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [error, setError] = useState("");

  const burnAmt = Number(amount) || 0;

  async function handleBurn() {
    if (!publicKey) { setVisible(true); return; }
    setError("");

    let tokenAccount: string;
    try {
      const mintPk = new PublicKey(mint);
      tokenAccount = getAssociatedTokenAddressSync(mintPk, publicKey, false, TOKEN_PROGRAM_ID).toBase58();
    } catch {
      setError("Invalid mint address");
      return;
    }

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/burn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payer: publicKey.toBase58(),
              mint,
              tokenAccount,
              amount: String(burnAmt),
              decimals: 0, // user enters whole-token amounts; server treats as raw
            }),
          }).then(async (r) => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error ?? "Failed to build transaction");
            return d;
          }),
        {
          onState: setTxState,
          onConfirmed: async (s) => {
            await fetch("/api/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ signature: s, action: "burn", wallet: publicKey.toBase58(), mint }),
            });
          },
        }
      );
      setSig(signature);
    } catch (e) {
      setError(parseError(e, "burn"));
      setTxState("failed");
    }
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">Burn tokens</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">Permanently remove tokens from circulation. This action is irreversible.</p>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⊘</div>
            <p className="tx-success-label">{burnAmt.toLocaleString()} tokens burned</p>
            <a
              className="lp-mono"
              href={`https://solscan.io/tx/${sig}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setAmount(""); setSig(""); }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="lp-card burn-card" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
            <div className="burn-field">
              <label className="wizard-field-label">Mint address</label>
              <input
                className="wizard-input"
                placeholder="Token mint address"
                value={mint}
                onChange={(e) => setMint(e.target.value.trim())}
              />
            </div>

            <div className="burn-field">
              <label className="wizard-field-label">Amount to burn</label>
              <input
                className="wizard-input"
                type="number"
                placeholder="0"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="burn-warning">
              <span className="burn-warning-icon">⚠</span>
              <div>
                <strong>This action is permanent and cannot be undone.</strong><br />
                Burned tokens are removed from total supply forever.
              </div>
            </div>

            {error && <p className="tool-error">{error}</p>}

            {txState !== "idle" && txState !== "failed" ? (
              <div className="tx-state">
                <div className="tx-step active">
                  <span className="tx-step-spinner" />
                  {txState === "building" && "Building transaction…"}
                  {txState === "sign" && "Sign in your wallet"}
                  {txState === "submitting" && "Submitting to Solana…"}
                  {txState === "confirming" && "Confirming…"}
                </div>
              </div>
            ) : (
              <button
                className="lp-btn lp-btn--primary burn-btn"
                disabled={!burnAmt || !mint}
                onClick={handleBurn}
              >
                {publicKey ? "Burn" : "Connect Wallet"}
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
