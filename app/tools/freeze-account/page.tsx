"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

export default function FreezeAccountPage() {
  const [token, setToken] = useState("frge");
  const [addresses, setAddresses] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");

  const lines = addresses.trim().split("\n").filter((l) => l.trim().length > 0);
  const validAddresses = lines.filter((l) => l.trim().length > 30);
  const platformFee = validAddresses.length * 0.01;

  function handleFreeze() {
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
            <h1 className="page-title">Freeze Account</h1>
            <div className="tool-fee-badge">0.01 SOL / address</div>
          </div>
          <p className="page-sub">
            Freeze one or more token accounts — blocks all transfers for those wallets. Requires freeze authority on the token.
          </p>
          <div className="tool-header-links">
            <Link href="/tools/unfreeze-account" className="tool-doc-link">Unfreeze →</Link>
            <Link href="/tools" className="tool-doc-link">← All tools</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">❄</div>
            <p className="tx-success-label">{validAddresses.length} account{validAddresses.length !== 1 ? "s" : ""} frozen</p>
            <p className="burn-remaining">Those wallets can no longer transfer {token.toUpperCase()}.</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setAddresses(""); }}>
                Freeze more
              </button>
              <Link href="/tools/unfreeze-account" className="lp-btn lp-btn--primary">Unfreeze</Link>
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
                <span className="revoke-info-label">Freeze authority</span>
                <span className="lp-mono revoke-info-value">7xKq...3fBn (your wallet)</span>
              </div>

              <div className="burn-field" style={{ marginTop: "1.25rem" }}>
                <label className="wizard-field-label">Wallet addresses to freeze</label>
                <p className="multisender-hint">One address per line</p>
                <textarea
                  className="multisender-textarea wizard-input"
                  rows={6}
                  placeholder={"7xKq9mFnBvAa...wallet1\n8yLr0nGoCwBb...wallet2"}
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                />
                <div className="multisender-stats">
                  <span>{lines.length} lines</span>
                  <span className={validAddresses.length < lines.length ? "multisender-stat--warn" : ""}>
                    {validAddresses.length} valid
                  </span>
                </div>
              </div>

              <div className="burn-warning">
                <span className="burn-warning-icon">⚠</span>
                <div>
                  Frozen accounts <strong>cannot send or receive</strong> {token.toUpperCase()} until unfrozen.
                  You can reverse this with the Unfreeze Account tool.
                </div>
              </div>
            </div>

            {validAddresses.length > 0 && (
              <div className="cost-summary lp-card">
                <div className="cost-summary-title">Cost summary</div>
                <div className="cost-row">
                  <span>Platform fee ({validAddresses.length} × 0.01 SOL)</span>
                  <span className="lp-mono">{platformFee.toFixed(3)} SOL</span>
                </div>
                <div className="cost-row">
                  <span>Network gas (est.)</span>
                  <span className="lp-mono">~0.000005 SOL</span>
                </div>
                <div className="cost-row cost-row--total">
                  <span>Total (est.)</span>
                  <span className="lp-mono">~{(platformFee + 0.000005).toFixed(3)} SOL</span>
                </div>
              </div>
            )}

            <div className="wizard-actions">
              {txState !== "idle" ? (
                <div className="tx-state">
                  <div className="tx-step active">
                    <span className="tx-step-spinner" />
                    {txState === "building" && "Building transactions…"}
                    {txState === "sign" && "Sign in your wallet"}
                    {txState === "submitting" && "Submitting to Solana…"}
                    {txState === "confirming" && "Confirming…"}
                  </div>
                </div>
              ) : (
                <button
                  className="lp-btn lp-btn--primary burn-btn"
                  disabled={validAddresses.length === 0}
                  onClick={handleFreeze}
                >
                  Freeze {validAddresses.length > 0 ? `${validAddresses.length} Account${validAddresses.length !== 1 ? "s" : ""}` : "Accounts"}
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
