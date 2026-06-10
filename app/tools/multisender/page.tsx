"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

export default function MultisenderPage() {
  const [token, setToken] = useState("sol");
  const [recipients, setRecipients] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");

  const lines = recipients.trim().split("\n").filter((l) => l.trim().length > 0);
  const validLines = lines.filter((l) => {
    const parts = l.split(",");
    return parts.length >= 2 && parts[0].trim().length > 30;
  });

  function handleSend() {
    setTxState("building");
    setTimeout(() => setTxState("sign"), 900);
    setTimeout(() => setTxState("submitting"), 2200);
    setTimeout(() => setTxState("confirming"), 3800);
    setTimeout(() => setTxState("confirmed"), 5500);
  }

  const EXAMPLE = `7xKq9mFnBvAa...wallet1, 100\n8yLr0nGoCwBb...wallet2, 250\n9zMs1oHpDxCc...wallet3, 500`;

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Multisender</h1>
            <div className="tool-fee-badge">0.05 SOL + rent</div>
          </div>
          <p className="page-sub">Send tokens to hundreds of wallets in one batched signing flow.</p>
          <div className="tool-header-links">
            <Link href="/blog/how-to-bulk-send-solana-tokens" className="tool-doc-link">Guide</Link>
            <Link href="/docs/multisender" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Tokens sent to {validLines.length} wallets</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setRecipients(""); }}>
                Send again
              </button>
              <Link href="/dashboard" className="lp-btn lp-btn--primary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card pool-section">
              <div className="pool-section-title">1. Select token to send</div>
              <select className="wizard-select" value={token} onChange={(e) => setToken(e.target.value)}>
                <option value="sol">SOL (native)</option>
                <option value="usdc">USDC</option>
                <option value="usdt">USDT</option>
                <option value="bonk">BONK</option>
                <option value="frge">FRGE — Forge Token</option>
                <option value="custom">Paste mint address…</option>
              </select>
              {token === "custom" && (
                <input className="wizard-input" style={{ marginTop: "0.75rem" }} placeholder="Token mint address…" />
              )}
            </div>

            <div className="lp-card pool-section">
              <div className="pool-section-title">2. Recipients</div>
              <p className="multisender-hint">
                One recipient per line: <code>wallet_address, amount</code>
              </p>
              <textarea
                className="multisender-textarea wizard-input"
                rows={8}
                placeholder={EXAMPLE}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <div className="multisender-stats">
                <span>{lines.length} lines</span>
                <span className={validLines.length < lines.length ? "multisender-stat--warn" : ""}>
                  {validLines.length} valid
                </span>
                {validLines.length < lines.length && (
                  <span className="multisender-stat--warn">{lines.length - validLines.length} invalid</span>
                )}
              </div>
            </div>

            {validLines.length > 0 && (
              <div className="cost-summary lp-card">
                <div className="cost-summary-title">Cost summary</div>
                <div className="cost-row">
                  <span>Platform fee</span>
                  <span className="lp-mono">0.05 SOL</span>
                </div>
                <div className="cost-row">
                  <span>Account rent ({validLines.length} accounts)</span>
                  <span className="lp-mono">~{(validLines.length * 0.002).toFixed(3)} SOL</span>
                </div>
                <div className="cost-row">
                  <span>Network fee</span>
                  <span className="lp-mono">~0.001 SOL</span>
                </div>
                <div className="cost-row cost-row--total">
                  <span>Total (est.)</span>
                  <span className="lp-mono">~{(0.05 + validLines.length * 0.002 + 0.001).toFixed(3)} SOL</span>
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
                  className="lp-btn lp-btn--primary"
                  disabled={validLines.length === 0}
                  onClick={handleSend}
                >
                  Review &amp; Send
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
