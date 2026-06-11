"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";

export default function MakeImmutablePage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [error, setError] = useState("");

  async function handleRevoke() {
    if (!publicKey) { setVisible(true); return; }
    setError("");

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payer: publicKey.toBase58(), mint, type: "update" }),
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
              body: JSON.stringify({ signature: s, action: "makeImmutable", wallet: publicKey.toBase58(), mint }),
            });
          },
        }
      );
      setSig(signature);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxState("failed");
    }
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Make Immutable</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">
            Revoke update authority to permanently lock your token&apos;s metadata on-chain. No one can change the name, symbol, or URI ever again.
          </p>
          <div className="tool-header-links">
            <Link href="/docs/make-immutable" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">◻</div>
            <p className="tx-success-label">Token is now immutable</p>
            <p className="burn-remaining">Metadata is permanently locked on-chain.</p>
            <a
              className="lp-mono"
              href={`https://solscan.io/tx/${sig}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <Link href="/dashboard" className="lp-btn lp-btn--secondary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Mint address</label>
                <input
                  className="wizard-input"
                  placeholder="Token mint address"
                  value={mint}
                  onChange={(e) => setMint(e.target.value.trim())}
                />
              </div>

              <div className="burn-warning">
                <span className="burn-warning-icon">⚠</span>
                <div>
                  <strong>This action is permanent and cannot be undone.</strong><br />
                  After revoking, the name, symbol, logo, and all on-chain metadata fields are locked forever.
                </div>
              </div>

              <label className="revoke-confirm-check">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                I understand this permanently locks all on-chain metadata
              </label>

              {error && <p className="tool-error">{error}</p>}
            </div>

            <div className="wizard-actions">
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
                  disabled={!confirmed || !mint}
                  onClick={handleRevoke}
                >
                  {publicKey ? "Make Immutable" : "Connect Wallet"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
