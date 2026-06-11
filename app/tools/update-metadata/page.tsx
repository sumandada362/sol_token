"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";

export default function UpdateMetadataPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [uri, setUri] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [error, setError] = useState("");

  async function handleUpdate() {
    if (!publicKey) { setVisible(true); return; }
    setError("");

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/update-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payer: publicKey.toBase58(), mint, name, symbol, uri }),
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
              body: JSON.stringify({ signature: s, action: "updateMetadata", wallet: publicKey.toBase58(), mint, name, symbol, metadataUri: uri }),
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
            <h1 className="page-title">Update Metadata</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">Edit your token&apos;s name, symbol, and metadata URI on-chain. Requires update authority.</p>
          <div className="tool-header-links">
            <Link href="/docs/update-metadata" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Metadata updated{symbol ? ` for ${symbol}` : ""}</p>
            <a
              className="lp-mono"
              href={`https://solscan.io/tx/${sig}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setSig(""); }}>
                Edit again
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Mint address</label>
                <input className="wizard-input" placeholder="Token mint address" value={mint} onChange={(e) => setMint(e.target.value.trim())} />
              </div>

              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 2 }}>
                  <label className="wizard-field-label">Name</label>
                  <input className="wizard-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" maxLength={30} />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Symbol</label>
                  <input className="wizard-input" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="SYM" maxLength={10} />
                </div>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Metadata URI</label>
                <input
                  className="wizard-input"
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  placeholder="https://ipfs.io/ipfs/…"
                />
              </div>

              {error && <p className="tool-error">{error}</p>}
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">Cost summary</div>
              <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.05 SOL</span></div>
              <div className="cost-row"><span>Network fee</span><span className="lp-mono">~0.001 SOL</span></div>
              <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~0.051 SOL</span></div>
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
                  className="lp-btn lp-btn--primary"
                  disabled={!mint || !name || !symbol || !uri}
                  onClick={handleUpdate}
                >
                  {publicKey ? "Update Metadata" : "Connect Wallet"}
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
