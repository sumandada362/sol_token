"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { parseError } from "@/lib/wallet/parseError";
import type { AuthorityInfo } from "@/app/api/check-authority/route";

type Phase = "input" | "checking" | "confirmed" | "denied" | "signing" | "done";

export default function RevokeFreezePage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [tokenInfo, setTokenInfo] = useState<AuthorityInfo | null>(null);
  const [checkError, setCheckError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [txError, setTxError] = useState("");

  async function handleCheck() {
    if (!publicKey) { setVisible(true); return; }
    if (!mint.trim()) return;
    setCheckError("");
    setPhase("checking");

    try {
      const res = await fetch(`/api/check-authority?mint=${encodeURIComponent(mint.trim())}`);
      const data = await res.json();
      if (!res.ok) { setCheckError(data.error ?? "Token not found."); setPhase("input"); return; }

      const info = data as AuthorityInfo;
      setTokenInfo(info);

      if (!info.freezeAuthority) {
        setCheckError("Freeze authority is already revoked for this token.");
        setPhase("input");
      } else if (info.freezeAuthority !== publicKey.toBase58()) {
        setPhase("denied");
      } else {
        setPhase("confirmed");
      }
    } catch {
      setCheckError("Failed to fetch token info. Check the mint address and try again.");
      setPhase("input");
    }
  }

  async function handleRevoke() {
    if (!publicKey) return;
    setTxError("");
    setPhase("signing");

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payer: publicKey.toBase58(), mint: mint.trim(), type: "freeze" }),
          }).then(async (r) => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error ?? "Failed to build transaction");
            return d;
          }),
        {
          onState: setTxState,
          onConfirmed: async (s) => {
            await fetch("/api/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ signature: s, action: "revokeFreeze", wallet: publicKey.toBase58(), mint: mint.trim() }),
            });
          },
        }
      );
      setSig(signature);
      setPhase("done");
    } catch (e) {
      setTxError(parseError(e, "revoke-freeze"));
      setTxState("failed");
      setPhase("confirmed");
    }
  }

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Revoke Freeze Authority</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">
            Remove the freeze authority so no wallet holding this token can ever be frozen by anyone.
          </p>
          <div className="tool-header-links">
            <Link href="/docs/revoke-freeze" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {phase === "done" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⊗</div>
            <p className="tx-success-label">Freeze authority revoked</p>
            <p className="burn-remaining">No wallet holding this token can be frozen.</p>
            <a className="lp-mono" style={{ fontSize: "0.8em" }}
              href={`https://solscan.io/tx/${sig}?cluster=${network}`} target="_blank" rel="noopener noreferrer">
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <Link href="/tools" className="lp-btn lp-btn--secondary">All Tools</Link>
            </div>
          </div>
        ) : phase === "denied" ? (
          <div className="lp-card">
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✗</p>
              <p className="tool-error" style={{ marginBottom: "1rem" }}>
                Your connected wallet is not the freeze authority for this token.
              </p>
              {tokenInfo && (
                <p className="lp-mono" style={{ fontSize: "0.78rem", color: "var(--lp-muted)", marginBottom: "1rem" }}>
                  Authority: {tokenInfo.freezeAuthority?.slice(0, 8)}…{tokenInfo.freezeAuthority?.slice(-8)}
                </p>
              )}
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setTokenInfo(null); }}>
                Try a different token
              </button>
            </div>
          </div>
        ) : phase === "confirmed" || phase === "signing" ? (
          <div className="lp-card burn-card">
            <div className="authority-confirmed-badge">
              <span className="authority-confirmed-icon">✓</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span>Authority confirmed — <strong>{tokenInfo?.name}</strong> ({tokenInfo?.symbol})</span>
                <span className="lp-mono" style={{ fontSize: "0.75rem", color: "var(--lp-muted)" }}>
                  Freeze authority: {tokenInfo?.freezeAuthority?.slice(0, 8)}…{tokenInfo?.freezeAuthority?.slice(-8)}
                </span>
              </div>
            </div>

            <div className="burn-warning" style={{ marginTop: "1rem" }}>
              <span className="burn-warning-icon">⚠</span>
              <div>
                <strong>This action is permanent and cannot be undone.</strong><br />
                After revoking, no one can freeze or unfreeze any token account for this mint.
              </div>
            </div>

            <label className="revoke-confirm-check" style={{ marginTop: "1rem" }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I understand this permanently removes freeze authority
            </label>

            {txError && <p className="tool-error" style={{ marginTop: "0.75rem" }}>{txError}</p>}

            <div className="wizard-actions" style={{ marginTop: "1rem" }}>
              {phase === "signing" && txState !== "failed" ? (
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
                <>
                  <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setConfirmed(false); setTxError(""); }}>
                    Back
                  </button>
                  <button className="lp-btn lp-btn--primary burn-btn" disabled={!confirmed} onClick={handleRevoke}>
                    Revoke Freeze Authority
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Mint address</label>
                <input
                  className="wizard-input"
                  placeholder="Token mint address"
                  value={mint}
                  onChange={(e) => { setMint(e.target.value.trim()); setCheckError(""); }}
                />
              </div>
              {checkError && <p className="tool-error" style={{ marginTop: "0.5rem" }}>{checkError}</p>}
            </div>

            <div className="wizard-actions">
              {phase === "checking" ? (
                <div className="tx-state">
                  <div className="tx-step active">
                    <span className="tx-step-spinner" />
                    Checking authority…
                  </div>
                </div>
              ) : (
                <button
                  className="lp-btn lp-btn--primary"
                  disabled={!mint.trim()}
                  onClick={handleCheck}
                >
                  {publicKey ? "Check" : "Connect Wallet"}
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
