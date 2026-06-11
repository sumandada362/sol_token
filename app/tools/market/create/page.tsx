"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

export default function MarketCreatePage() {
  const [baseToken, setBaseToken] = useState("frge");
  const [quoteToken, setQuoteToken] = useState("sol");
  const [minOrderSize, setMinOrderSize] = useState("1");
  const [tickSize, setTickSize] = useState("0.0001");
  const [txState, setTxState] = useState<TxState>("idle");

  function handleCreate() {
    setTxState("building");
    setTimeout(() => setTxState("sign"), 900);
    setTimeout(() => setTxState("submitting"), 2200);
    setTimeout(() => setTxState("confirming"), 3800);
    setTimeout(() => setTxState("confirmed"), 5500);
  }

  const QUOTE_COSTS: Record<string, string> = {
    sol: "~2.85 SOL",
    usdc: "~2.85 SOL",
    usdt: "~2.85 SOL",
  };

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Create OpenBook Market</h1>
            <div className="tool-fee-badge">0.05 SOL + pass-through</div>
          </div>
          <p className="page-sub">
            Create an OpenBook v2 order-book market for your token. Required by some DEXs (e.g. Raydium CPMM).
          </p>
          <div className="tool-header-links">
            <Link href="/blog/how-to-create-openbook-market" className="tool-doc-link">Guide</Link>
            <Link href="/docs/openbook-market" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⬡</div>
            <p className="tx-success-label">OpenBook market created</p>
            <p className="burn-remaining">{baseToken.toUpperCase()}/{quoteToken.toUpperCase()} market is live</p>
            <div className="tx-success-actions">
              <Link href="/pool" className="lp-btn lp-btn--primary">Add liquidity</Link>
              <Link href="/dashboard" className="lp-btn lp-btn--secondary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Base token</label>
                  <select className="wizard-select" value={baseToken} onChange={(e) => setBaseToken(e.target.value)}>
                    <option value="frge">FRGE — Forge Token</option>
                    <option value="sinu">SINU — Solana Inu</option>
                    <option value="custom">Paste mint…</option>
                  </select>
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Quote currency</label>
                  <select className="wizard-select" value={quoteToken} onChange={(e) => setQuoteToken(e.target.value)}>
                    <option value="sol">SOL</option>
                    <option value="usdc">USDC</option>
                    <option value="usdt">USDT</option>
                  </select>
                </div>
              </div>

              {baseToken === "custom" && (
                <div className="burn-field">
                  <label className="wizard-field-label">Base mint address</label>
                  <input className="wizard-input" placeholder="Token mint address…" />
                </div>
              )}

              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Min order size</label>
                  <input
                    className="wizard-input"
                    type="number"
                    value={minOrderSize}
                    onChange={(e) => setMinOrderSize(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Tick size (price increment)</label>
                  <input
                    className="wizard-input"
                    type="number"
                    value={tickSize}
                    onChange={(e) => setTickSize(e.target.value)}
                    placeholder="0.0001"
                  />
                </div>
              </div>

              <div className="revoke-info-row">
                <span className="revoke-info-label">Market pair</span>
                <span className="lp-mono revoke-info-value">{baseToken.toUpperCase()}/{quoteToken.toUpperCase()}</span>
              </div>
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">Cost summary</div>
              <div className="cost-row">
                <span>OpenBook market creation (pass-through)</span>
                <span className="lp-mono">{QUOTE_COSTS[quoteToken] ?? "~3.5 SOL"}</span>
              </div>
              <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.05 SOL</span></div>
              <div className="cost-row"><span>Network fee</span><span className="lp-mono">~0.001 SOL</span></div>
              <div className="cost-row cost-row--total">
                <span>Total (est.)</span>
                <span className="lp-mono">~2.90 SOL</span>
              </div>
              <p className="cost-summary-note">
                The ~2.85 SOL market creation cost goes directly to the OpenBook program as account rent.
                It is not a FORGE fee.
              </p>
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
                  onClick={handleCreate}
                >
                  Create Market
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
