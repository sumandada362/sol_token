"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "@/components/Footer";

const MOCK_PRICES: Record<string, number> = {
  USD: 172.45,
  EUR: 157.20,
  GBP: 134.50,
  BTC: 0.00218,
  ETH: 0.0612,
  JPY: 26200,
};

export default function SolConverterPage() {
  const [solAmt, setSolAmt] = useState("1");
  const [currency, setCurrency] = useState("USD");
  const [fiatAmt, setFiatAmt] = useState("");
  const [lastUpdated] = useState("Live (simulated)");

  const price = MOCK_PRICES[currency] ?? 172.45;

  useEffect(() => {
    const n = parseFloat(solAmt);
    if (!isNaN(n)) {
      const converted = n * price;
      setFiatAmt(currency === "BTC" ? converted.toFixed(6) : currency === "ETH" ? converted.toFixed(4) : converted.toFixed(2));
    }
  }, [solAmt, currency, price]);

  function onFiatChange(v: string) {
    setFiatAmt(v);
    const n = parseFloat(v);
    if (!isNaN(n) && price > 0) setSolAmt((n / price).toFixed(6));
  }

  const currencies = ["USD", "EUR", "GBP", "JPY", "BTC", "ETH"];

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">SOL Price Converter</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">
            Convert SOL to USD, EUR, GBP, BTC, ETH and more. No wallet needed.
          </p>
        </div>

        <div className="lp-card converter-card">
          <div className="converter-card-title">
            <span>SOL / {currency}</span>
            <span className="converter-price-badge">
              1 SOL = {currency === "BTC" ? price.toFixed(6) : currency === "ETH" ? price.toFixed(4) : price.toLocaleString()} {currency}
            </span>
          </div>
          <div className="converter-row">
            <div className="converter-field">
              <label className="wizard-field-label">SOL</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="any"
                value={solAmt}
                onChange={(e) => setSolAmt(e.target.value)}
              />
            </div>
            <div className="converter-equals">=</div>
            <div className="converter-field">
              <label className="wizard-field-label">{currency}</label>
              <input
                className="wizard-input"
                type="number"
                min="0"
                step="any"
                value={fiatAmt}
                onChange={(e) => onFiatChange(e.target.value)}
              />
            </div>
          </div>

          <div className="converter-quick-btns">
            {currencies.map((c) => (
              <button
                key={c}
                className={`converter-quick-btn${currency === c ? " converter-quick-btn--active" : ""}`}
                onClick={() => setCurrency(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="converter-updated">Price: {lastUpdated}</div>
        </div>

        {/* Quick reference grid */}
        <div className="lp-card converter-card">
          <div className="converter-card-title">Quick reference (SOL → {currency})</div>
          <div className="converter-ref-grid">
            {[0.001, 0.01, 0.1, 1, 5, 10, 100, 1000].map((sol) => (
              <div key={sol} className="converter-ref-row">
                <span className="lp-mono">{sol} SOL</span>
                <span className="lp-mono">
                  {currency === "BTC"
                    ? (sol * price).toFixed(6)
                    : currency === "ETH"
                    ? (sol * price).toFixed(4)
                    : (sol * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                  {currency}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="converter-disclaimer lp-card">
          <span className="burn-warning-icon">ⓘ</span>
          Prices are simulated for UI purposes. In production, live prices would be fetched from an oracle.
          Not financial advice.
        </div>
      </div>
      <Footer />
    </div>
  );
}
