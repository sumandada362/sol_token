"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

const POOLS = [
  { id: "frge-ray", label: "FRGE / SOL — Raydium", dex: "Raydium", token: "FRGE" },
  { id: "sinu-orca", label: "SINU / SOL — Orca", dex: "Orca", token: "SINU" },
  { id: "frge-meta", label: "FRGE / USDC — Meteora", dex: "Meteora", token: "FRGE" },
];

export default function PoolAddPage() {
  const [pool, setPool] = useState(POOLS[0].id);
  const [tokenAmt, setTokenAmt] = useState("");
  const [solAmt, setSolAmt] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");

  const selected = POOLS.find((p) => p.id === pool)!;

  function handleAdd() {
    setTxState("building");
    setTimeout(() => setTxState("sign"), 900);
    setTimeout(() => setTxState("submitting"), 2200);
    setTimeout(() => setTxState("confirming"), 3800);
    setTimeout(() => setTxState("confirmed"), 5500);
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header" data-reveal>
          <h1 className="page-title">Add to Pool</h1>
          <p className="page-sub">Deposit tokens into an existing liquidity pool to earn fees.</p>
        </div>

        <div className="pool-tabs" data-reveal style={{ "--delay": "60ms" } as React.CSSProperties}>
          <Link href="/pool" className="pool-tab">Create pool</Link>
          <span className="pool-tab pool-tab--active">Add liquidity</span>
          <Link href="/pool/remove" className="pool-tab">Remove liquidity</Link>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Liquidity added to {selected.dex}</p>
            <div className="tx-success-actions">
              <Link href="/pool/remove" className="lp-btn lp-btn--secondary">Manage position</Link>
              <Link href="/create-token" className="lp-btn lp-btn--primary">Create Token</Link>
            </div>
          </div>
        ) : (
          <div data-stagger>
            <div className="lp-card pool-section">
              <div className="pool-section-title">1. Select pool</div>
              <select className="wizard-select" value={pool} onChange={(e) => setPool(e.target.value)}>
                {POOLS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <div className="revoke-info-row" style={{ marginTop: "0.75rem" }}>
                <span className="revoke-info-label">DEX</span>
                <span className="revoke-info-value">{selected.dex}</span>
              </div>
            </div>

            <div className="lp-card pool-section">
              <div className="pool-section-title">2. Set deposit amounts</div>
              <div className="pool-amount-row">
                <label className="pool-amount-label">
                  {selected.token} amount
                  <input className="wizard-input" type="number" placeholder="0" value={tokenAmt} onChange={(e) => setTokenAmt(e.target.value)} />
                </label>
                <label className="pool-amount-label">
                  SOL amount
                  <input className="wizard-input" type="number" placeholder="0" value={solAmt} onChange={(e) => setSolAmt(e.target.value)} />
                </label>
                <button className="pool-max-btn">Max</button>
              </div>
              <p className="multisender-hint" style={{ marginTop: "0.5rem" }}>
                Amounts must match the current pool ratio or slippage may apply.
              </p>
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">Cost summary</div>
              <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.05 SOL</span></div>
              <div className="cost-row"><span>Network fee</span><span className="lp-mono">~0.001 SOL</span></div>
              <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~0.051 SOL</span></div>
              <p className="cost-summary-note">Token and SOL deposits are not fees — they become your LP position.</p>
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
                  disabled={!tokenAmt || !solAmt}
                  onClick={handleAdd}
                >
                  Add Liquidity
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
