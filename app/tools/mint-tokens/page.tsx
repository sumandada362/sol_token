"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";

export default function MintTokensPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [mint, setMint] = useState("");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [decimals, setDecimals] = useState("9");
  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [error, setError] = useState("");

  const mintAmt = Number(amount) || 0;

  async function handleMint() {
    if (!publicKey) { setVisible(true); return; }
    setError("");

    let destAddr: string;
    try {
      const mintPk = new PublicKey(mint);
      destAddr = destination.trim()
        ? new PublicKey(destination.trim()).toBase58()
        : getAssociatedTokenAddressSync(mintPk, publicKey, false, TOKEN_PROGRAM_ID).toBase58();
    } catch {
      setError("Invalid mint or destination address");
      return;
    }

    const rawAmount = BigInt(Math.round(mintAmt * 10 ** Number(decimals)));

    try {
      const { signature } = await execute(
        () =>
          fetch("/api/tx/mint-more", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payer: publicKey.toBase58(),
              mint,
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
              body: JSON.stringify({ signature: s, action: "mintMore", wallet: publicKey.toBase58(), mint }),
            });
          },
        }
      );
      setSig(signature);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setTxState("failed");
    }
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Mint Tokens</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">Increase your token&apos;s supply by minting new tokens to any wallet. Requires mint authority.</p>
          <div className="tool-header-links">
            <Link href="/docs/mint-tokens" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {txState === "confirmed" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">{mintAmt.toLocaleString()} tokens minted</p>
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
                Mint again
              </button>
              <Link href="/create-token" className="lp-btn lp-btn--primary">Create Token</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="lp-card burn-card">
              <div className="burn-field">
                <label className="wizard-field-label">Mint address</label>
                <input className="wizard-input" placeholder="Token mint address" value={mint} onChange={(e) => setMint(e.target.value.trim())} />
              </div>

              <div className="wizard-field-row">
                <div className="burn-field" style={{ flex: 2 }}>
                  <label className="wizard-field-label">Amount to mint</label>
                  <input className="wizard-input" type="number" placeholder="0" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Decimals</label>
                  <input className="wizard-input" type="number" min="0" max="9" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
                </div>
              </div>

              <div className="burn-field">
                <label className="wizard-field-label">Destination wallet</label>
                <input
                  className="wizard-input"
                  placeholder="Defaults to your wallet"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>

              {error && <p className="tool-error">{error}</p>}
            </div>

            <div className="cost-summary lp-card">
              <div className="cost-summary-title">Cost summary</div>
              <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.05 SOL</span></div>
              <div className="cost-row"><span>Network fee</span><span className="lp-mono">~0.001 SOL</span></div>
              <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~0.051 SOL</span></div>
            </div>

            <div className="wizard-actions">
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
                  className="lp-btn lp-btn--primary"
                  disabled={!mintAmt || !mint}
                  onClick={handleMint}
                >
                  {publicKey ? "Mint Tokens" : "Connect Wallet"}
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
