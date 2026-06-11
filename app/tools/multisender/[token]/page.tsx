"use client";
import Link from "next/link";
import { use, useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

const TOKEN_META: Record<string, { name: string; symbol: string; decimals: number }> = {
  sol:  { name: "Solana",   symbol: "SOL",  decimals: 9 },
  usdc: { name: "USD Coin", symbol: "USDC", decimals: 6 },
  usdt: { name: "Tether",   symbol: "USDT", decimals: 6 },
  bonk: { name: "Bonk",     symbol: "BONK", decimals: 5 },
};

export default function MultisenderTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const meta = TOKEN_META[token.toLowerCase()] ?? { name: token.toUpperCase(), symbol: token.toUpperCase(), decimals: 9 };

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

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Send {meta.symbol}</h1>
            <div className="tool-fee-badge">0.01 SOL / tx</div>
          </div>
          <p className="page-sub">
            Bulk-send {meta.name} ({meta.symbol}) to many wallets in one signing flow.
          </p>
          <div className="tool-header-links">
            <Link href="/tools/multisender" className="tool-doc-link">← All tokens</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">{meta.symbol} sent to {validLines.length} wallets</p>
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
              <div className="pool-section-title">Recipients</div>
              <p className="multisender-hint">
                One per line: <code>wallet_address, {meta.symbol.toLowerCase()}_amount</code>
              </p>
              <textarea
                className="multisender-textarea wizard-input"
                rows={8}
                placeholder={`7xKq9mFnBvAa...wallet1, 100\n8yLr0nGoCwBb...wallet2, 250`}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <div className="multisender-stats">
                <span>{lines.length} lines</span>
                <span className={validLines.length < lines.length ? "multisender-stat--warn" : ""}>
                  {validLines.length} valid
                </span>
              </div>
            </div>

            {validLines.length > 0 && (
              <div className="cost-summary lp-card">
                <div className="cost-summary-title">Cost summary</div>
                <div className="cost-row">
                  <span>Platform fee (flat per transaction)</span>
                  <span className="lp-mono">0.010 SOL</span>
                </div>
                <div className="cost-row">
                  <span>Account rent ({validLines.length} accounts)</span>
                  <span className="lp-mono">~{(validLines.length * 0.002).toFixed(3)} SOL</span>
                </div>
                <div className="cost-row cost-row--total">
                  <span>Total (est.)</span>
                  <span className="lp-mono">~{(0.01 + validLines.length * 0.002 + 0.001).toFixed(3)} SOL</span>
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
                  Review &amp; Send {meta.symbol}
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
