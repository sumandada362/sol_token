"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

export default function BurnPage() {
  const [token, setToken] = useState("frge");
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState<"idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed">("idle");

  const balance = 500_000_000;
  const burnAmt = Number(amount) || 0;
  const remaining = balance - burnAmt;

  function handleBurn() {
    setTxState("building");
    setTimeout(() => setTxState("sign"), 800);
    setTimeout(() => setTxState("submitting"), 2000);
    setTimeout(() => setTxState("confirming"), 3500);
    setTimeout(() => setTxState("confirmed"), 5000);
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header">
          <h1 className="page-title">Burn tokens</h1>
          <p className="page-sub">Permanently remove tokens from circulation. This action is irreversible.</p>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⊘</div>
            <p className="tx-success-label">{burnAmt.toLocaleString()} {token.toUpperCase()} burned</p>
            <p className="burn-remaining">New supply: {remaining.toLocaleString()}</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setAmount(""); }}>Done</button>
            </div>
          </div>
        ) : (
          <div className="lp-card burn-card">
            {/* Token selector */}
            <div className="burn-field">
              <label className="wizard-field-label">Token</label>
              <select className="wizard-select" value={token} onChange={(e) => setToken(e.target.value)}>
                <option value="frge">FRGE — Forge Token</option>
                <option value="sinu">SINU — Solana Inu</option>
              </select>
            </div>

            <div className="burn-balance">
              Your balance: <span className="lp-mono">{balance.toLocaleString()} {token.toUpperCase()}</span>
            </div>

            {/* Amount */}
            <div className="burn-field">
              <label className="wizard-field-label">Amount to burn</label>
              <div className="burn-amount-row">
                <input
                  className="wizard-input"
                  type="number"
                  placeholder="0"
                  min="0"
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button className="pool-max-btn" onClick={() => setAmount(String(balance))}>Max</button>
              </div>
            </div>

            {/* Warning */}
            <div className="burn-warning">
              <span className="burn-warning-icon">⚠</span>
              <div>
                <strong>This action is permanent and cannot be undone.</strong><br />
                You can only burn tokens you own. Burned tokens are removed from total supply forever.
              </div>
            </div>

            {/* Impact preview */}
            {burnAmt > 0 && (
              <div className="burn-impact">
                <div className="burn-impact-row">
                  <span>Current supply</span>
                  <span className="lp-mono">{balance.toLocaleString()}</span>
                </div>
                <div className="burn-impact-row burn-impact-row--burn">
                  <span>Burning</span>
                  <span className="lp-mono">− {burnAmt.toLocaleString()}</span>
                </div>
                <div className="burn-impact-row burn-impact-row--result">
                  <span>New supply</span>
                  <span className="lp-mono">{remaining.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Tx state */}
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
                disabled={!burnAmt || burnAmt > balance}
                onClick={handleBurn}
              >
                Burn
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
