"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

const DEXES = [
  { id: "raydium", name: "Raydium", cost: "~0.50 SOL", fee: 0.50, desc: "Most volume. Best for new launches." },
  { id: "orca", name: "Orca", cost: "~0.40 SOL", fee: 0.40, desc: "Concentrated liquidity. Great UX." },
  { id: "meteora", name: "Meteora", cost: "~0.45 SOL", fee: 0.45, desc: "Dynamic pools. Strong for memecoins." },
  { id: "pumpswap", name: "PumpSwap", cost: "~0.40 SOL", fee: 0.40, desc: "Pump.fun native. Low barrier." },
  { id: "invariant", name: "Invariant", cost: "~0.45 SOL", fee: 0.45, desc: "Concentrated liquidity on Solana." },
  { id: "fluxbeam", name: "FluxBeam", cost: "~0.40 SOL", fee: 0.40, desc: "Token-2022 compatible pools." },
];

export default function PoolPage() {
  const [token, setToken] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [txState, setTxState] = useState<"idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed">("idle");

  function toggleDex(id: string) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  function handleSign() {
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
          <h1 className="page-title">Add liquidity</h1>
          <p className="page-sub">Create liquidity on one or more DEXs with a single signing flow.</p>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Liquidity added successfully</p>
            <div className="tx-success-actions">
              <Link href="/token/example" className="lp-btn lp-btn--primary">View token page</Link>
              <Link href="/dashboard" className="lp-btn lp-btn--secondary">Go to dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Token selector */}
            <div className="pool-section lp-card">
              <div className="pool-section-title">1. Select token</div>
              <div className="pool-token-row">
                <select className="wizard-select" value={token} onChange={(e) => setToken(e.target.value)}>
                  <option value="">— My tokens —</option>
                  <option value="frge">FRGE — Forge Token</option>
                  <option value="sinu">SINU — Solana Inu</option>
                </select>
                <span className="pool-or">or</span>
                <input className="wizard-input" placeholder="Paste mint address…" value={token} onChange={(e) => setToken(e.target.value)} />
              </div>
            </div>

            {/* DEX selection */}
            <div className="pool-section lp-card">
              <div className="pool-section-title">2. Choose DEXs</div>
              <div className="dex-grid">
                {DEXES.map((dex) => (
                  <button
                    key={dex.id}
                    className={`dex-card ${selected.includes(dex.id) ? "dex-card--selected" : ""}`}
                    onClick={() => toggleDex(dex.id)}
                  >
                    <div className="dex-card-name">{dex.name}</div>
                    <div className="dex-card-cost lp-mono">{dex.cost}</div>
                    <div className="dex-card-desc">{dex.desc}</div>
                    {selected.includes(dex.id) && <div className="dex-card-check">✓</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Amounts */}
            {selected.length > 0 && (
              <div className="pool-section lp-card">
                <div className="pool-section-title">3. Set amounts</div>
                {selected.map((id) => {
                  const dex = DEXES.find((d) => d.id === id)!;
                  return (
                    <div key={id} className="pool-amount-row">
                      <span className="pool-amount-dex">{dex.name}</span>
                      <label className="pool-amount-label">
                        Token amount
                        <input className="wizard-input" type="number" placeholder="0" />
                      </label>
                      <label className="pool-amount-label">
                        SOL amount
                        <input className="wizard-input" type="number" placeholder="0" />
                      </label>
                      <button className="pool-max-btn">Max</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cost summary */}
            {selected.length > 0 && (
              <div className="cost-summary lp-card">
                <div className="cost-summary-title">Cost summary</div>
                {selected.map((id) => {
                  const dex = DEXES.find((d) => d.id === id)!;
                  return (
                    <div key={id} className="cost-row">
                      <span>{dex.name} pool setup (paid to {dex.name})</span>
                      <span className="lp-mono">{dex.cost}</span>
                    </div>
                  );
                })}
                <div className="cost-row"><span>FORGE fee ({selected.length} × 0.1 SOL)</span><span className="lp-mono">{(selected.length * 0.1).toFixed(1)} SOL</span></div>
                <div className="cost-row cost-row--total"><span>Total (est.)</span><span className="lp-mono">~{(selected.reduce((sum, id) => sum + (DEXES.find((d) => d.id === id)?.fee ?? 0), 0) + selected.length * 0.1).toFixed(2)} SOL</span></div>
                <p className="cost-summary-note">DEX setup costs (0.4–0.6 SOL each) go directly to the DEX protocol — not to FORGE.</p>
              </div>
            )}

            {/* Actions */}
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
                  disabled={selected.length === 0}
                  onClick={handleSign}
                >
                  Review &amp; Sign
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
