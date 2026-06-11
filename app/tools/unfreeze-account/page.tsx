"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { parseError } from "@/lib/wallet/parseError";
import type { AuthorityInfo } from "@/app/api/check-authority/route";

type Phase = "input" | "checking" | "form" | "denied" | "signing" | "done";

function parseWallets(raw: string): { valid: string[]; invalid: number } {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const valid: string[] = [];
  let invalid = 0;
  for (const line of lines) {
    try { new PublicKey(line); valid.push(line); }
    catch { invalid++; }
  }
  return { valid, invalid };
}

export default function UnfreezeAccountPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [tokenInfo, setTokenInfo] = useState<AuthorityInfo | null>(null);
  const [checkError, setCheckError] = useState("");
  const [addresses, setAddresses] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [txError, setTxError] = useState("");

  const { valid: validWallets, invalid: invalidCount } = parseWallets(addresses);
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
  const platformFee = validWallets.length * 0.01;

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
        setCheckError("Freeze authority has been revoked for this token.");
        setPhase("input");
      } else if (info.freezeAuthority !== publicKey.toBase58()) {
        setPhase("denied");
      } else {
        setPhase("form");
      }
    } catch {
      setCheckError("Failed to fetch token info. Check the mint address and try again.");
      setPhase("input");
    }
  }

  async function handleUnfreeze() {
    if (!publicKey || !validWallets.length) return;
    setTxError("");
    setPhase("signing");

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/freeze-accounts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ payer: publicKey.toBase58(), mint: mint.trim(), wallets: validWallets, type: "thaw" }),
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
              body: JSON.stringify({ signature: s, action: "unfreezeAccounts", wallet: publicKey.toBase58(), mint: mint.trim(), count: validWallets.length }),
            });
          },
        }
      );
      setSig(signature);
      setPhase("done");
    } catch (e) {
      setTxError(parseError(e, "unfreeze-account"));
      setTxState("failed");
      setPhase("form");
    }
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">Unfreeze Account</h1>
            <div className="tool-fee-badge">0.01 SOL / wallet</div>
          </div>
          <p className="page-sub">
            Restore transfer ability to frozen token accounts. Requires freeze authority.
          </p>
          <div className="tool-header-links">
            <Link href="/tools/freeze-account" className="tool-doc-link">Freeze →</Link>
          </div>
        </div>

        {/* Done */}
        {phase === "done" && (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">◌</div>
            <p className="tx-success-label">{validWallets.length} account{validWallets.length !== 1 ? "s" : ""} unfrozen</p>
            <p className="burn-remaining">Those wallets can now transfer {tokenInfo?.symbol} again.</p>
            <a className="lp-mono" style={{ fontSize: "0.8em" }}
              href={`https://solscan.io/tx/${sig}?cluster=${network}`} target="_blank" rel="noopener noreferrer">
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("form"); setAddresses(""); setSig(""); }}>
                Unfreeze more
              </button>
              <Link href="/tools/freeze-account" className="lp-btn lp-btn--primary">Freeze</Link>
            </div>
          </div>
        )}

        {/* Denied */}
        {phase === "denied" && (
          <div className="lp-card">
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✗</p>
              <p className="tool-error" style={{ marginBottom: "1rem" }}>
                Your connected wallet is not the freeze authority for this token.
              </p>
              {tokenInfo && (
                <p className="lp-mono" style={{ fontSize: "0.78rem", color: "var(--lp-muted)", marginBottom: "1rem" }}>
                  Freeze authority: {tokenInfo.freezeAuthority?.slice(0, 8)}…{tokenInfo.freezeAuthority?.slice(-8)}
                </p>
              )}
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setTokenInfo(null); }}>
                Try a different token
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {(phase === "form" || phase === "signing") && (
          <>
            <div className="lp-card burn-card">
              <div className="authority-confirmed-badge" style={{ marginBottom: "1.25rem" }}>
                <span className="authority-confirmed-icon">✓</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span>Authority confirmed — <strong>{tokenInfo?.name}</strong> ({tokenInfo?.symbol})</span>
                  <span className="lp-mono" style={{ fontSize: "0.75rem", color: "var(--lp-muted)" }}>
                    Freeze authority: {tokenInfo?.freezeAuthority?.slice(0, 8)}…{tokenInfo?.freezeAuthority?.slice(-8)}
                  </span>
                </div>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Wallet addresses to unfreeze</label>
                <p className="multisender-hint">One address per line — max 20</p>
                <textarea
                  className="multisender-textarea wizard-input"
                  rows={6}
                  placeholder={"WalletAddress1...\nWalletAddress2..."}
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                />
                <div className="multisender-stats">
                  <span>{validWallets.length} valid</span>
                  {invalidCount > 0 && <span className="multisender-stat--warn">{invalidCount} invalid (will be skipped)</span>}
                </div>
              </div>

              <div className="burn-warning" style={{ marginTop: "1rem" }}>
                <span className="burn-warning-icon">ℹ</span>
                <div>Only currently frozen accounts can be unfrozen. Submitting an active address will fail on-chain.</div>
              </div>

              {txError && <p className="tool-error" style={{ marginTop: "0.75rem" }}>{txError}</p>}
            </div>

            {validWallets.length > 0 && (
              <div className="cost-summary lp-card">
                <div className="cost-summary-title">Cost summary</div>
                <div className="cost-row">
                  <span>Platform fee ({validWallets.length} × 0.01 SOL)</span>
                  <span className="lp-mono">{platformFee.toFixed(3)} SOL</span>
                </div>
                <div className="cost-row"><span>Network fee (est.)</span><span className="lp-mono">~0.00001 SOL</span></div>
                <div className="cost-row cost-row--total">
                  <span>Total</span>
                  <span className="lp-mono">~{(platformFee + 0.00001).toFixed(3)} SOL</span>
                </div>
              </div>
            )}

            <div className="wizard-actions">
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
                  <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setTxError(""); }}>Back</button>
                  <button className="lp-btn lp-btn--primary burn-btn" disabled={validWallets.length === 0} onClick={handleUnfreeze}>
                    Unfreeze {validWallets.length > 0 ? `${validWallets.length} Account${validWallets.length !== 1 ? "s" : ""}` : "Accounts"}
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Input / Checking */}
        {(phase === "input" || phase === "checking") && (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Mint address</label>
                <input className="wizard-input" placeholder="Token mint address" value={mint}
                  onChange={(e) => { setMint(e.target.value.trim()); setCheckError(""); }} />
              </div>
              {checkError && <p className="tool-error" style={{ marginTop: "0.5rem" }}>{checkError}</p>}
            </div>
            <div className="wizard-actions">
              {phase === "checking" ? (
                <div className="tx-state">
                  <div className="tx-step active"><span className="tx-step-spinner" />Checking authority…</div>
                </div>
              ) : (
                <button className="lp-btn lp-btn--primary" disabled={!mint.trim()} onClick={handleCheck}>
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
