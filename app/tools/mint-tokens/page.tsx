"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { parseError } from "@/lib/wallet/parseError";
import type { AuthorityInfo } from "@/app/api/check-authority/route";

type Phase = "input" | "checking" | "form" | "denied" | "signing" | "done";

export default function MintTokensPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [tokenInfo, setTokenInfo] = useState<AuthorityInfo | null>(null);
  const [checkError, setCheckError] = useState("");

  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [decimals, setDecimals] = useState("9");

  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [txError, setTxError] = useState("");

  const mintAmt = Number(amount) || 0;
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

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

      if (!info.mintAuthority) {
        setCheckError("Mint authority has already been revoked for this token.");
        setPhase("input");
      } else if (info.mintAuthority !== publicKey.toBase58()) {
        setPhase("denied");
      } else {
        setPhase("form");
      }
    } catch {
      setCheckError("Failed to fetch token info. Check the mint address and try again.");
      setPhase("input");
    }
  }

  async function handleMint() {
    if (!publicKey) return;
    setTxError("");

    let destAddr: string;
    try {
      const mintPk = new PublicKey(mint.trim());
      destAddr = destination.trim()
        ? new PublicKey(destination.trim()).toBase58()
        : getAssociatedTokenAddressSync(mintPk, publicKey, false, TOKEN_PROGRAM_ID).toBase58();
    } catch {
      setTxError("Invalid destination address.");
      return;
    }

    const rawAmount = BigInt(Math.round(mintAmt * 10 ** Number(decimals)));
    setPhase("signing");

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/mint-more", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payer: publicKey.toBase58(),
              mint: mint.trim(),
              destination: destAddr,
              amount: rawAmount.toString(),
              decimals: Number(decimals),
            }),
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
              body: JSON.stringify({ signature: s, action: "mintMore", wallet: publicKey.toBase58(), mint: mint.trim() }),
            });
          },
        }
      );
      setSig(signature);
      setPhase("done");
    } catch (e) {
      setTxError(parseError(e, "mint-tokens"));
      setTxState("failed");
      setPhase("form");
    }
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">Mint Tokens</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">Increase your token&apos;s supply by minting new tokens to any wallet. Requires mint authority.</p>
          <div className="tool-header-links">
            <Link href="/docs/mint-tokens" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {/* Done */}
        {phase === "done" && (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">{mintAmt.toLocaleString()} {tokenInfo?.symbol ?? "tokens"} minted</p>
            <a className="lp-mono" style={{ fontSize: "0.8em" }}
              href={`https://solscan.io/tx/${sig}?cluster=${network}`} target="_blank" rel="noopener noreferrer">
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("form"); setAmount(""); setSig(""); }}>
                Mint again
              </button>
            </div>
          </div>
        )}

        {/* Denied */}
        {phase === "denied" && (
          <div className="lp-card">
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✗</p>
              <p className="tool-error" style={{ marginBottom: "1rem" }}>
                Your connected wallet is not the mint authority for this token.
              </p>
              {tokenInfo && (
                <p className="lp-mono" style={{ fontSize: "0.78rem", color: "var(--lp-muted)", marginBottom: "1rem" }}>
                  Mint authority: {tokenInfo.mintAuthority?.slice(0, 8)}…{tokenInfo.mintAuthority?.slice(-8)}
                </p>
              )}
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setTokenInfo(null); }}>
                Try a different token
              </button>
            </div>
          </div>
        )}

        {/* Mint form (after authority confirmed) */}
        {(phase === "form" || phase === "signing") && (
          <>
            <div className="lp-card burn-card">
              <div className="authority-confirmed-badge" style={{ marginBottom: "1.25rem" }}>
                <span className="authority-confirmed-icon">✓</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span>Authority confirmed — <strong>{tokenInfo?.name}</strong> ({tokenInfo?.symbol})</span>
                  <span className="lp-mono" style={{ fontSize: "0.75rem", color: "var(--lp-muted)" }}>
                    Mint authority: {tokenInfo?.mintAuthority?.slice(0, 8)}…{tokenInfo?.mintAuthority?.slice(-8)}
                  </span>
                </div>
              </div>

              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 2 }}>
                  <label className="wizard-field-label">Amount to mint</label>
                  <input className="wizard-input" type="number" placeholder="0" min="1"
                    value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Decimals</label>
                  <input className="wizard-input" type="number" min="0" max="9"
                    value={decimals} onChange={(e) => setDecimals(e.target.value)} />
                </div>
              </div>

              <div className="burn-field" style={{ marginTop: "0.75rem" }}>
                <label className="wizard-field-label">Destination wallet <span className="wizard-hint">defaults to your wallet</span></label>
                <input className="wizard-input" placeholder="Leave blank to mint to yourself"
                  value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>

              {txError && <p className="tool-error" style={{ marginTop: "0.75rem" }}>{txError}</p>}
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">Cost summary</div>
              <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.05 SOL</span></div>
              <div className="cost-row"><span>Network fee</span><span className="lp-mono">~0.001 SOL</span></div>
              <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~0.051 SOL</span></div>
            </div>

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
                  <button className="lp-btn lp-btn--primary" disabled={!mintAmt} onClick={handleMint}>
                    Mint Tokens
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
