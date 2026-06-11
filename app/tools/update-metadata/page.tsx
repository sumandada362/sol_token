"use client";
import Link from "next/link";
import { useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { parseError } from "@/lib/wallet/parseError";
import type { AuthorityInfo } from "@/app/api/check-authority/route";

type Phase = "input" | "checking" | "edit" | "denied" | "signing" | "done";

export default function UpdateMetadataPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mint, setMint] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [tokenInfo, setTokenInfo] = useState<AuthorityInfo | null>(null);
  const [checkError, setCheckError] = useState("");

  // Editable fields (pre-filled from current metadata after check)
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [txState, setTxState] = useState<TxState>("idle");
  const [sig, setSig] = useState("");
  const [txError, setTxError] = useState("");

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

      if (!info.isMutable) {
        setCheckError("This token is immutable — metadata cannot be changed.");
        setPhase("input");
        return;
      }
      if (info.updateAuthority !== publicKey.toBase58()) {
        setPhase("denied");
        return;
      }

      // Pre-fill edit form with current values
      setName(info.name);
      setSymbol(info.symbol);
      setDescription(info.description);
      setWebsite(info.website);
      setTwitter(info.twitter);
      setTelegram(info.telegram);
      setLogoPreview(info.image);
      setLogoFile(null);
      setPhase("edit");
    } catch {
      setCheckError("Failed to fetch token info. Check the mint address and try again.");
      setPhase("input");
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setUploadError("Image must be under 2 MB"); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setUploadError("Only PNG, JPG, or WebP allowed"); return;
    }
    setUploadError("");
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleUpdate() {
    if (!publicKey || !tokenInfo) return;
    setTxError("");
    setUploadError("");
    setPhase("signing");

    try {
      // 1. Upload new metadata to IPFS if anything changed
      let metadataUri = tokenInfo.uri;
      const textChanged = description !== tokenInfo.description ||
        website !== tokenInfo.website ||
        twitter !== tokenInfo.twitter ||
        telegram !== tokenInfo.telegram;

      if (logoFile || textChanged) {
        const uploadForm = new FormData();
        if (logoFile) {
          uploadForm.append("file", logoFile);
        } else {
          uploadForm.append("imageUrl", tokenInfo.image);
        }
        uploadForm.append("name", name.trim());
        uploadForm.append("symbol", symbol.trim().toUpperCase());
        if (description) uploadForm.append("description", description);
        if (website) uploadForm.append("website", website);
        if (twitter) uploadForm.append("twitter", twitter);
        if (telegram) uploadForm.append("telegram", telegram);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "Metadata upload failed");
        metadataUri = uploadData.metadataUri;
      }

      // 2. Build and submit update transaction
      const { signature } = await execute(
        () =>
          fetch("/api/tx/update-metadata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payer: publicKey.toBase58(),
              mint: mint.trim(),
              name: name.trim(),
              symbol: symbol.trim().toUpperCase(),
              uri: metadataUri,
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
              body: JSON.stringify({
                signature: s,
                action: "updateMetadata",
                wallet: publicKey.toBase58(),
                mint: mint.trim(),
                name: name.trim(),
                symbol: symbol.trim().toUpperCase(),
                metadataUri,
              }),
            });
          },
        }
      );
      setSig(signature);
      setPhase("done");
    } catch (e) {
      setTxError(parseError(e, "update-metadata"));
      setTxState("failed");
      setPhase("edit");
    }
  }

  // Keep URI fresh in the edit state label
  const canSubmit = name.trim() && symbol.trim();

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">Update Metadata</h1>
            <div className="tool-fee-badge">0.05 SOL</div>
          </div>
          <p className="page-sub">Edit your token&apos;s name, symbol, description, logo, and social links. Requires update authority.</p>
          <div className="tool-header-links">
            <Link href="/docs/update-metadata" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {/* ── Done ── */}
        {phase === "done" && (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Metadata updated</p>
            <a className="lp-mono" style={{ fontSize: "0.8em" }}
              href={`https://solscan.io/tx/${sig}?cluster=${network}`} target="_blank" rel="noopener noreferrer">
              View on Solscan ↗
            </a>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => {
                setPhase("input"); setSig(""); setTokenInfo(null); setMint("");
              }}>
                Update another token
              </button>
            </div>
          </div>
        )}

        {/* ── Denied ── */}
        {phase === "denied" && (
          <div className="lp-card">
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>✗</p>
              <p className="tool-error" style={{ marginBottom: "1rem" }}>
                Your connected wallet is not the update authority for this token.
              </p>
              {tokenInfo && (
                <p className="lp-mono" style={{ fontSize: "0.78rem", color: "var(--lp-muted)", marginBottom: "1rem" }}>
                  Authority: {tokenInfo.updateAuthority.slice(0, 8)}…{tokenInfo.updateAuthority.slice(-8)}
                </p>
              )}
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setTokenInfo(null); }}>
                Try a different token
              </button>
            </div>
          </div>
        )}

        {/* ── Edit form (shown after authority confirmed) ── */}
        {(phase === "edit" || phase === "signing") && (
          <>
            <div className="lp-card burn-card">
              <div className="authority-confirmed-badge" style={{ marginBottom: "1.25rem" }}>
                <span className="authority-confirmed-icon">✓</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span>Authority confirmed — editing <strong>{tokenInfo?.name}</strong> ({tokenInfo?.symbol})</span>
                  <span className="lp-mono" style={{ fontSize: "0.75rem", color: "var(--lp-muted)" }}>
                    Update authority: {tokenInfo?.updateAuthority.slice(0, 8)}…{tokenInfo?.updateAuthority.slice(-8)}
                  </span>
                </div>
              </div>

              {/* Logo */}
              <div className="burn-field">
                <label className="wizard-field-label">Logo <span className="wizard-hint">PNG, JPG, WebP — max 2 MB</span></label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {logoPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <button type="button" className="lp-btn lp-btn--secondary" style={{ fontSize: "0.82rem" }}
                    onClick={() => fileRef.current?.click()}>
                    {logoFile ? "Change logo" : "Upload new logo"}
                  </button>
                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }} onChange={handleLogoChange} />
                </div>
                {uploadError && <p className="tool-error" style={{ marginTop: 4 }}>{uploadError}</p>}
              </div>

              {/* Name + Symbol */}
              <div className="wizard-field-row" style={{ marginTop: "0.75rem" }}>
                <div className="burn-field" style={{ flex: 2 }}>
                  <label className="wizard-field-label">Name</label>
                  <input className="wizard-input" value={name} maxLength={30}
                    onChange={(e) => setName(e.target.value)} placeholder="Token name" />
                </div>
                <div className="burn-field" style={{ flex: 1 }}>
                  <label className="wizard-field-label">Symbol</label>
                  <input className="wizard-input" value={symbol} maxLength={10}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="SYM" />
                </div>
              </div>

              {/* Description */}
              <div className="burn-field" style={{ marginTop: "0.75rem" }}>
                <label className="wizard-field-label">Description</label>
                <textarea className="wizard-input" value={description} maxLength={500} rows={3}
                  onChange={(e) => setDescription(e.target.value)} placeholder="Describe your token…"
                  style={{ resize: "vertical" }} />
              </div>

              {/* Social links */}
              <div className="burn-field" style={{ marginTop: "0.75rem" }}>
                <label className="wizard-field-label">Website</label>
                <input className="wizard-input" value={website}
                  onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
              </div>
              <div className="burn-field" style={{ marginTop: "0.5rem" }}>
                <label className="wizard-field-label">X (Twitter)</label>
                <input className="wizard-input" value={twitter}
                  onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/…" />
              </div>
              <div className="burn-field" style={{ marginTop: "0.5rem" }}>
                <label className="wizard-field-label">Telegram</label>
                <input className="wizard-input" value={telegram}
                  onChange={(e) => setTelegram(e.target.value)} placeholder="https://t.me/…" />
              </div>

              <p className="wizard-hint" style={{ marginTop: "1rem", fontSize: "0.78rem", color: "var(--lp-muted)" }}>
                Decimals and total supply cannot be changed after creation.
              </p>

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
                    {txState === "building" && "Uploading metadata…"}
                    {txState === "sign" && "Sign in your wallet"}
                    {txState === "submitting" && "Submitting to Solana…"}
                    {txState === "confirming" && "Confirming…"}
                  </div>
                </div>
              ) : (
                <>
                  <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setTxError(""); }}>
                    Back
                  </button>
                  <button className="lp-btn lp-btn--primary" disabled={!canSubmit} onClick={handleUpdate}>
                    Update Metadata
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── Input / Checking ── */}
        {(phase === "input" || phase === "checking") && (
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
