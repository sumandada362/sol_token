"use client";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

export default function UnitConverterPage() {
  const [solInput, setSolInput] = useState("1");
  const [lamportsInput, setLamportsInput] = useState("1000000000");
  const [tokenAmt, setTokenAmt] = useState("1");
  const [decimals, setDecimals] = useState("9");
  const [rawUnits, setRawUnits] = useState("1000000000");

  function onSolChange(v: string) {
    setSolInput(v);
    const n = parseFloat(v);
    if (!isNaN(n)) setLamportsInput(Math.round(n * 1e9).toString());
  }

  function onLamportsChange(v: string) {
    setLamportsInput(v);
    const n = parseInt(v);
    if (!isNaN(n)) setSolInput((n / 1e9).toString());
  }

  function onTokenAmtChange(v: string) {
    setTokenAmt(v);
    const n = parseFloat(v);
    const d = parseInt(decimals) || 9;
    if (!isNaN(n)) setRawUnits(Math.round(n * Math.pow(10, d)).toString());
  }

  function onRawUnitsChange(v: string) {
    setRawUnits(v);
    const n = parseInt(v);
    const d = parseInt(decimals) || 9;
    if (!isNaN(n)) setTokenAmt((n / Math.pow(10, d)).toString());
  }

  function onDecimalsChange(v: string) {
    setDecimals(v);
    const n = parseFloat(tokenAmt);
    const d = parseInt(v) || 9;
    if (!isNaN(n)) setRawUnits(Math.round(n * Math.pow(10, d)).toString());
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Unit Converter</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">
            Convert SOL ↔ lamports and token amounts ↔ raw on-chain units instantly. No wallet needed.
          </p>
          <div className="tool-header-links">
            <Link href="/blog/sol-to-lamports-converter-guide" className="tool-doc-link">Guide</Link>
          </div>
        </div>

        {/* SOL / Lamports */}
        <div className="lp-card converter-card">
          <div className="converter-card-title">SOL ↔ Lamports</div>
          <p className="converter-card-desc">1 SOL = 1,000,000,000 lamports (10⁹)</p>
          <div className="converter-row">
            <div className="converter-field">
              <label className="wizard-field-label">SOL</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="any"
                value={solInput}
                onChange={(e) => onSolChange(e.target.value)}
              />
            </div>
            <div className="converter-equals">=</div>
            <div className="converter-field">
              <label className="wizard-field-label">Lamports</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="1"
                value={lamportsInput}
                onChange={(e) => onLamportsChange(e.target.value)}
              />
            </div>
          </div>
          <div className="converter-quick-btns">
            {[0.01, 0.1, 1, 10, 100].map((v) => (
              <button key={v} className="converter-quick-btn" onClick={() => onSolChange(v.toString())}>
                {v} SOL
              </button>
            ))}
          </div>
        </div>

        {/* Token amount / raw units */}
        <div className="lp-card converter-card">
          <div className="converter-card-title">Token Amount ↔ Raw Units</div>
          <p className="converter-card-desc">Raw units = token amount × 10^decimals</p>
          <div className="converter-row" style={{ alignItems: "flex-end" }}>
            <div className="converter-field">
              <label className="wizard-field-label">Token amount</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="any"
                value={tokenAmt}
                onChange={(e) => onTokenAmtChange(e.target.value)}
              />
            </div>
            <div className="converter-field" style={{ maxWidth: "90px" }}>
              <label className="wizard-field-label">Decimals</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                max="18"
                step="1"
                value={decimals}
                onChange={(e) => onDecimalsChange(e.target.value)}
              />
            </div>
            <div className="converter-equals">=</div>
            <div className="converter-field">
              <label className="wizard-field-label">Raw units</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="1"
                value={rawUnits}
                onChange={(e) => onRawUnitsChange(e.target.value)}
              />
            </div>
          </div>
          <div className="converter-quick-btns">
            {[6, 9].map((d) => (
              <button key={d} className="converter-quick-btn" onClick={() => onDecimalsChange(d.toString())}>
                {d} decimals {d === 6 ? "(USDC)" : "(SOL)"}
              </button>
            ))}
          </div>
        </div>

        <div className="converter-info lp-card">
          <div className="converter-card-title">Reference</div>
          <div className="converter-ref-grid">
            <div className="converter-ref-row"><span>SOL decimals</span><span className="lp-mono">9</span></div>
            <div className="converter-ref-row"><span>USDC decimals</span><span className="lp-mono">6</span></div>
            <div className="converter-ref-row"><span>BONK decimals</span><span className="lp-mono">5</span></div>
            <div className="converter-ref-row"><span>1 SOL</span><span className="lp-mono">1,000,000,000 lamports</span></div>
            <div className="converter-ref-row"><span>0.001 SOL (min fee)</span><span className="lp-mono">1,000,000 lamports</span></div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
