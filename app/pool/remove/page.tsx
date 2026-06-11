"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

const POSITIONS = [
  { id: "pos1", label: "FRGE / SOL — Raydium", lpTokens: "14,320.50 LP", token: "FRGE", tokenAmt: "240,000", solAmt: "12.4" },
  { id: "pos2", label: "SINU / SOL — Orca", lpTokens: "8,100.00 LP", token: "SINU", tokenAmt: "95,000", solAmt: "5.8" },
];

export default function PoolRemovePage() {
  const [position, setPosition] = useState(POSITIONS[0].id);
  const [percent, setPercent] = useState(25);
  const [txState, setTxState] = useState<TxState>("idle");

  const pos = POSITIONS.find((p) => p.id === position)!;
  const returnToken = Math.round(parseInt(pos.tokenAmt.replace(/,/g, "")) * percent / 100).toLocaleString();
  const returnSol = (parseFloat(pos.solAmt) * percent / 100).toFixed(3);

  function handleRemove() {
    setTxState("building");
    setTimeout(() => setTxState("sign"), 900);
    setTimeout(() => setTxState("submitting"), 2200);
    setTimeout(() => setTxState("confirming"), 3800);
    setTimeout(() => setTxState("confirmed"), 5500);
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header">
          <h1 className="page-title">Remove Liquidity</h1>
          <p className="page-sub">Withdraw your share from a liquidity pool and receive the underlying tokens.</p>
        </div>

        <div className="pool-tabs">
          <Link href="/pool" className="pool-tab">Create pool</Link>
          <Link href="/pool/add" className="pool-tab">Add liquidity</Link>
          <span className="pool-tab pool-tab--active">Remove liquidity</span>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Liquidity removed</p>
            <p className="burn-remaining">Received {returnToken} {pos.token} + {returnSol} SOL</p>
            <div className="tx-success-actions">
              <Link href="/pool/add" className="lp-btn lp-btn--secondary">Add back</Link>
              <Link href="/create-token" className="lp-btn lp-btn--primary">Create Token</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card pool-section">
              <div className="pool-section-title">1. Select LP position</div>
              <select className="wizard-select" value={position} onChange={(e) => setPosition(e.target.value)}>
                {POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} · {p.lpTokens}</option>
                ))}
              </select>
            </div>

            <div className="lp-card pool-section">
              <div className="pool-section-title">2. Amount to remove</div>
              <div className="remove-pct-row">
                <span className="remove-pct-val">{percent}%</span>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={percent}
                  className="remove-slider"
                  onChange={(e) => setPercent(Number(e.target.value))}
                />
              </div>
              <div className="remove-quick-btns">
                {[25, 50, 75, 100].map((v) => (
                  <button key={v} className={`converter-quick-btn${percent === v ? " converter-quick-btn--active" : ""}`} onClick={() => setPercent(v)}>
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">You will receive (est.)</div>
              <div className="cost-row">
                <span>{pos.token}</span>
                <span className="lp-mono">{returnToken} {pos.token}</span>
              </div>
              <div className="cost-row">
                <span>SOL</span>
                <span className="lp-mono">{returnSol} SOL</span>
              </div>
              <div className="cost-row" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                <span>Platform fee</span><span className="lp-mono">0.05 SOL</span>
              </div>
              <p className="cost-summary-note">Actual amounts depend on pool price at confirmation time.</p>
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
                <button className="lp-btn lp-btn--primary" onClick={handleRemove}>
                  Remove {percent}% Liquidity
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
