"use client";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

type TxState = "idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed";

export default function UpdateMetadataPage() {
  const [token, setToken] = useState("frge");
  const [name, setName] = useState("Forge Token");
  const [symbol, setSymbol] = useState("FRGE");
  const [uri, setUri] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");

  function handleUpdate() {
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
            <h1 className="page-title">Update Metadata</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">Edit your token&apos;s name, symbol, logo URI, and social links on-chain. Requires update authority.</p>
          <div className="tool-header-links">
            <Link href="/blog/how-to-update-token-metadata" className="tool-doc-link">Guide</Link>
            <Link href="/docs/update-metadata" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Metadata updated for {symbol}</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => setTxState("idle")}>Edit again</button>
              <Link href={`/token/${token}`} className="lp-btn lp-btn--primary">View token</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Token</label>
                <select
                  className="wizard-select"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (e.target.value === "frge") { setName("Forge Token"); setSymbol("FRGE"); }
                    if (e.target.value === "sinu") { setName("Solana Inu"); setSymbol("SINU"); }
                  }}
                >
                  <option value="frge">FRGE — Forge Token</option>
                  <option value="sinu">SINU — Solana Inu</option>
                </select>
              </div>

              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 2 }}>
                  <label className="wizard-field-label">Name</label>
                  <input className="wizard-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Token name" />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Symbol</label>
                  <input className="wizard-input" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="SYM" maxLength={10} />
                </div>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Metadata URI</label>
                <input className="wizard-input" value={uri} onChange={(e) => setUri(e.target.value)} placeholder="https://arweave.net/…" />
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Description (off-chain)</label>
                <textarea
                  className="wizard-input"
                  rows={3}
                  style={{ resize: "vertical" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short token description…"
                />
              </div>

              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Website</label>
                  <input className="wizard-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">X / Twitter</label>
                  <input className="wizard-input" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="@handle" />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Telegram</label>
                  <input className="wizard-input" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="t.me/…" />
                </div>
              </div>
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
                  disabled={!name || !symbol}
                  onClick={handleUpdate}
                >
                  Update Metadata
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
