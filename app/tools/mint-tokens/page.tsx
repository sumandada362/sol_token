"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

export default function MintTokensPage() {
  const [token, setToken] = useState("frge");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");

  const currentSupply = 1_000_000_000;
  const mintAmt = Number(amount) || 0;

  function handleMint() {
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
            <h1 className="page-title">Mint Tokens</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">Increase your token&apos;s supply by minting new tokens to any wallet. Requires mint authority.</p>
          <div className="tool-header-links">
            <Link href="/blog/how-to-mint-more-solana-tokens" className="tool-doc-link">Guide</Link>
            <Link href="/docs/mint-tokens" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">{mintAmt.toLocaleString()} {token.toUpperCase()} minted</p>
            <p className="burn-remaining">New supply: {(currentSupply + mintAmt).toLocaleString()}</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setAmount(""); }}>Mint again</button>
              <Link href="/dashboard" className="lp-btn lp-btn--primary">Dashboard</Link>
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

              <div className="burn-balance">
                Current supply: <span className="lp-mono">{currentSupply.toLocaleString()} {token.toUpperCase()}</span>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Amount to mint</label>
                <div className="burn-amount-row">
                  <input
                    className="wizard-input"
                    type="number"
                    placeholder="0"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Destination wallet</label>
                <input
                  className="wizard-input"
                  placeholder="Wallet address (default: your wallet)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              {mintAmt > 0 && (
                <div className="burn-impact">
                  <div className="burn-impact-row">
                    <span>Current supply</span>
                    <span className="lp-mono">{currentSupply.toLocaleString()}</span>
                  </div>
                  <div className="burn-impact-row" style={{ color: "var(--accent-ok, #4ade80)" }}>
                    <span>Minting</span>
                    <span className="lp-mono">+ {mintAmt.toLocaleString()}</span>
                  </div>
                  <div className="burn-impact-row burn-impact-row--result">
                    <span>New supply</span>
                    <span className="lp-mono">{(currentSupply + mintAmt).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">Cost summary</div>
              <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.05 SOL</span></div>
              <div className="cost-row"><span>Network fee</span><span className="lp-mono">~0.001 SOL</span></div>
              <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~0.051 SOL</span></div>
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
                  className="lp-btn lp-btn--primary"
                  disabled={!mintAmt || mintAmt <= 0}
                  onClick={handleMint}
                >
                  Mint Tokens
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
