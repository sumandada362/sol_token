"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

const POOLS = [
  { id: "frge-sol-ray",  label: "FRGE/SOL — Raydium CPMM",  balance: 142.53 },
  { id: "frge-sol-orc",  label: "FRGE/SOL — Orca Whirlpool", balance: 88.20  },
  { id: "frge-usdc-met", label: "FRGE/USDC — Meteora DLMM",  balance: 31.07  },
];

export default function BurnLpPage() {
  const [poolId, setPoolId] = useState(POOLS[0].id);
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");

  const pool = POOLS.find((p) => p.id === poolId)!;
  const burnAmt = Number(amount) || 0;
  const remaining = Math.max(0, pool.balance - burnAmt);

  function handleBurn() {
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
            <h1 className="page-title">Burn LP Tokens</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">
            Permanently burn your LP position tokens. The underlying assets remain in the pool and are redistributed to remaining LPs.
          </p>
          <div className="tool-header-links">
            <Link href="/tools" className="tool-doc-link">← All tools</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⊟</div>
            <p className="tx-success-label">{burnAmt.toFixed(2)} LP tokens burned</p>
            <p className="burn-remaining">Remaining LP position: {remaining.toFixed(2)}</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setAmount(""); setConfirmed(false); }}>Done</button>
              <Link href="/dashboard" className="lp-btn lp-btn--primary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Pool</label>
                <select className="wizard-select" value={poolId} onChange={(e) => { setPoolId(e.target.value); setAmount(""); setConfirmed(false); }}>
                  {POOLS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="burn-balance">
                LP token balance: <span className="lp-mono">{pool.balance.toFixed(2)} LP</span>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Amount to burn</label>
                <div className="burn-amount-row">
                  <input
                    className="wizard-input"
                    type="number"
                    placeholder="0"
                    min="0"
                    max={pool.balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <button className="pool-max-btn" onClick={() => setAmount(String(pool.balance))}>Max</button>
                </div>
              </div>

              {burnAmt > 0 && (
                <div className="burn-impact">
                  <div className="burn-impact-row">
                    <span>Current LP balance</span>
                    <span className="lp-mono">{pool.balance.toFixed(2)} LP</span>
                  </div>
                  <div className="burn-impact-row burn-impact-row--burn">
                    <span>Burning</span>
                    <span className="lp-mono">− {burnAmt.toFixed(2)} LP</span>
                  </div>
                  <div className="burn-impact-row burn-impact-row--result">
                    <span>Remaining</span>
                    <span className="lp-mono">{remaining.toFixed(2)} LP</span>
                  </div>
                </div>
              )}

              <div className="burn-warning">
                <span className="burn-warning-icon">⚠</span>
                <div>
                  <strong>This action is permanent and cannot be undone.</strong><br />
                  Burning LP tokens destroys your claim to the underlying pool assets. The pool itself is unaffected — only your share is removed.
                </div>
              </div>

              <label className="revoke-confirm-check">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                I understand this permanently burns my LP position and is irreversible
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
                  disabled={!burnAmt || burnAmt > pool.balance || !confirmed}
                  onClick={handleBurn}
                >
                  Burn LP Tokens
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
