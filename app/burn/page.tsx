"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import Footer from "@/components/Footer";
import { useScrollToTopOn } from "@/lib/useScrollToTop";
import TokenSelect from "@/components/TokenSelect";
import BalanceCheck from "@/components/BalanceCheck";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { parseError } from "@/lib/wallet/parseError";

/** Whole-token amount string → raw base-unit string, without float precision loss. */
function toRawAmount(amount: string, decimals: number): string {
  const [int = "0", frac = ""] = amount.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return (BigInt(int || "0") * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded || "0")).toString();
}

export default function BurnPage() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState<TxState>("idle");
  useScrollToTopOn(txState === "confirmed");
  const [sig, setSig] = useState("");
  const [error, setError] = useState("");

  const burnAmt = Number(amount) || 0;

  async function handleBurn() {
    if (!publicKey) { setVisible(true); return; }
    setError("");

    let mintPk: PublicKey;
    try {
      mintPk = new PublicKey(mint);
    } catch {
      setError("Invalid mint address");
      return;
    }

    try {
      // The mint account provides decimals (for raw-amount conversion) and the
      // owning program (SPL vs Token-2022) needed to derive the right ATA
      const info = await connection.getParsedAccountInfo(mintPk);
      const acc = info.value;
      const decimals: number | undefined =
        acc && "parsed" in acc.data ? acc.data.parsed?.info?.decimals : undefined;
      if (!acc || decimals === undefined) {
        setError("Token mint not found on this network.");
        return;
      }
      const tokenAccount = getAssociatedTokenAddressSync(mintPk, publicKey, false, acc.owner).toBase58();

      const { signature } = await execute(
        () =>
          fetch("/api/tx/burn", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payer: publicKey.toBase58(),
              mint,
              tokenAccount,
              amount: toRawAmount(amount, decimals),
              decimals,
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
              body: JSON.stringify({ signature: s, action: "burn", wallet: publicKey.toBase58(), mint }),
            });
          },
        }
      );
      setSig(signature);
    } catch (e) {
      setError(parseError(e, "burn"));
      setTxState("failed");
    }
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">Burn tokens</h1>
            <div className="tool-fee-badge tool-fee-badge--free">Free</div>
          </div>
          <p className="page-sub">Permanently remove tokens from circulation. This action is irreversible.</p>
          <div className="tool-header-links">
            <Link href="/docs/burn-tokens" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">⊘</div>
            <p className="tx-success-label">{burnAmt.toLocaleString()} tokens burned</p>
            <a
              className="lp-mono"
              href={`https://solscan.io/tx/${sig}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet"}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setTxState("idle"); setAmount(""); setSig(""); }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="lp-card burn-card" data-reveal style={{ "--delay": "80ms" } as React.CSSProperties}>
            <div className="burn-field">
              <label className="wizard-field-label">Mint address</label>
              <TokenSelect value={mint} onChange={(m, t) => { setMint(m); setBalance(t?.amount ?? null); setError(""); }} />
            </div>

            <div className="burn-field">
              <label className="wizard-field-label">Amount to burn</label>
              <div className="burn-amount-row">
                <input
                  className="wizard-input"
                  type="number"
                  placeholder="0"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {balance !== null && (
                  <button type="button" className="pool-max-btn" onClick={() => setAmount(String(balance))}>
                    Max
                  </button>
                )}
              </div>
              {balance !== null && (
                <span className="burn-balance">Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
              )}
            </div>

            <div className="burn-warning">
              <span className="burn-warning-icon">⚠</span>
              <div>
                <strong>This action is permanent and cannot be undone.</strong><br />
                Burned tokens are removed from total supply forever.
              </div>
            </div>

            <BalanceCheck requiredSol={0.001} />

            {error && <p className="tool-error">{error}</p>}

            {txState !== "idle" && txState !== "failed" ? (
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
                disabled={!burnAmt || !mint}
                onClick={handleBurn}
              >
                {publicKey ? "Burn" : "Connect Wallet"}
              </button>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
