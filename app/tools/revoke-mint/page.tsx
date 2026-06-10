"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

export default function RevokeMintPage() {
  const [token, setToken] = useState("frge");
  const [confirmed, setConfirmed] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");

  function handleRevoke() {
    setTxState("building");
    setTimeout(() => setTxState("sign"), 900);
    setTimeout(() => setTxState("submitting"), 2200);
    setTimeout(() => setTxState("confirming"), 3800);
    setTimeout(() => setTxState("confirmed"), 5500);
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Revoke Mint Authority</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">
            Permanently remove the mint authority from your token. New tokens can never be minted — supply is capped forever.
          </p>
          <div className="tool-header-links">
            <Link href="/blog/how-to-revoke-mint-authority" className="tool-doc-link">Guide</Link>
            <Link href="/docs/revoke-mint" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⊘</div>
            <p className="tx-success-label">Mint authority revoked for {token.toUpperCase()}</p>
            <p className="burn-remaining">Supply is now permanently fixed.</p>
            <div className="tx-success-actions">
              <Link href={`/token/${token}`} className="lp-btn lp-btn--primary">View token</Link>
              <Link href="/dashboard" className="lp-btn lp-btn--secondary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Token</label>
                <select className="wizard-select" value={token} onChange={(e) => setToken(e.target.value)}>
                  <option value="frge">FRGE — Forge Token</option>
                  <option value="sinu">SINU — Solana Inu</option>
                </select>
              </div>

              <div className="revoke-info-row">
                <span className="revoke-info-label">Current mint authority</span>
                <span className="lp-mono revoke-info-value">7xKq...3fBn (your wallet)</span>
              </div>
              <div className="revoke-info-row">
                <span className="revoke-info-label">Current supply</span>
                <span className="lp-mono revoke-info-value">1,000,000,000 {token.toUpperCase()}</span>
              </div>

              <div className="burn-warning">
                <span className="burn-warning-icon">⚠</span>
                <div>
                  <strong>This action is permanent and cannot be undone.</strong><br />
                  After revoking, no one — including you — can ever mint new tokens.
                  This permanently caps the total supply.
                </div>
              </div>

              <label className="revoke-confirm-check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I understand this action is irreversible and permanently caps the supply
              </label>
            </div>

            <div className="wizard-actions">
              {txState !== "idle" ? (
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
                  disabled={!confirmed}
                  onClick={handleRevoke}
                >
                  Revoke Mint Authority
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
