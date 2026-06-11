"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Keypair } from "@solana/web3.js";
import Footer from "@/components/Footer";
import { useTransaction, type TxState } from "@/lib/wallet/useTransaction";
import { PREFILL_KEY } from "@/components/CustomizeTokenPanel";

const STEPS = ["Connect", "Basics", "Branding", "Advanced", "Review", "Sign"];

interface FormState {
  name: string; symbol: string; supply: string; decimals: string;
  description: string; website: string; twitter: string; telegram: string;
  standard: "spl" | "token2022";
  revokeMint: boolean; revokeFreeze: boolean; revokeUpdate: boolean;
  vanityAddress: boolean;
}

const DEFAULT_FORM: FormState = {
  name: "", symbol: "", supply: "1000000000", decimals: "9",
  description: "", website: "", twitter: "", telegram: "",
  standard: "spl", revokeMint: false, revokeFreeze: false, revokeUpdate: false, vanityAddress: false,
};

export default function CreatePage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { execute } = useTransaction();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  // Read pre-fill data written by the homepage CustomizeTokenPanel
  useEffect(() => {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PREFILL_KEY);
    try {
      const d = JSON.parse(raw) as {
        name?: string; symbol?: string; supply?: string; decimals?: string;
        description?: string; logoBase64?: string; logoMime?: string;
        logoFilename?: string; logoUrl?: string;
      };
      setForm((f) => ({
        ...f,
        name: d.name || f.name,
        symbol: d.symbol || f.symbol,
        supply: d.supply || f.supply,
        decimals: d.decimals || f.decimals,
        description: d.description || f.description,
      }));
      if (d.logoBase64 && d.logoMime && d.logoFilename) {
        // Reconstruct File from base64 so the upload step works normally
        const byteStr = atob(d.logoBase64.split(",")[1]);
        const arr = new Uint8Array(byteStr.length);
        for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
        const file = new File([arr], d.logoFilename, { type: d.logoMime });
        setLogoFile(file);
        setLogoPreview(d.logoBase64);
      } else if (d.logoUrl) {
        setLogoPreview(d.logoUrl);
        // Create a tiny sentinel so the upload step sends the URL as the metadataUri
        // The IPFS upload can accept an external URL in place of a file in future;
        // for now we leave logoFile null and let the user upload on step 3 if desired.
      }
      setPrefilled(true);
      // Skip past Connect step if wallet already connected — or jump to Basics
      setStep(2);
    } catch {
      // ignore malformed prefill
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txError, setTxError] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [sig, setSig] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function next() { if (step < 5) setStep((s) => s + 1); }
  function back() { if (step > 1) setStep((s) => s - 1); }

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

  const platformFee = 0.1
    + (form.revokeMint ? 0.05 : 0)
    + (form.revokeFreeze ? 0.05 : 0);
  const totalFee = platformFee + 0.002;

  async function handleCreate() {
    if (!publicKey) { setVisible(true); return; }
    setTxError("");
    setStep(6);
    setTxState("building");

    try {
      // 1. Upload logo + metadata to IPFS
      let metadataUri = "";
      if (logoFile) {
        setTxState("building"); // still building while uploading
        const uploadForm = new FormData();
        uploadForm.append("file", logoFile);
        uploadForm.append("name", form.name);
        uploadForm.append("symbol", form.symbol);
        uploadForm.append("description", form.description);
        if (form.website) uploadForm.append("website", form.website);
        if (form.twitter) uploadForm.append("twitter", form.twitter);
        if (form.telegram) uploadForm.append("telegram", form.telegram);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: uploadForm });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error ?? "IPFS upload failed");
        metadataUri = uploadData.metadataUri;
      }

      // 2. Generate mint keypair client-side (public key goes to server; we sign locally)
      const mintKeypair = Keypair.generate();
      setMintAddress(mintKeypair.publicKey.toBase58());

      // 3. Build → sign (with both wallet + mint keypair) → submit → confirm
      const { signature } = await execute(
        () =>
          fetch("/api/tx/create-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payer: publicKey.toBase58(),
              mintPublicKey: mintKeypair.publicKey.toBase58(),
              name: form.name,
              symbol: form.symbol,
              supply: form.supply,
              decimals: Number(form.decimals),
              metadataUri,
              standard: form.standard,
              revokeMint: form.revokeMint,
              revokeFreeze: form.revokeFreeze,
              revokeUpdate: form.revokeUpdate,
            }),
          }).then(async (r) => {
            const d = await r.json();
            if (!r.ok) throw new Error(d.error ?? "Failed to build transaction");
            return d;
          }),
        {
          onState: setTxState,
          mintKeypair, // client partial-signs for the new mint account
          onConfirmed: async (s) => {
            setSig(s);
            await fetch("/api/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                signature: s,
                action: "createToken",
                wallet: publicKey.toBase58(),
                mint: mintKeypair.publicKey.toBase58(),
                name: form.name,
                symbol: form.symbol,
                metadataUri,
              }),
            });
          },
        }
      );
      setSig(signature);
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Transaction failed");
      setTxState("failed");
    }
  }

  function resetWizard() {
    setStep(1); setForm(DEFAULT_FORM); setLogoFile(null); setLogoPreview("");
    setTxState("idle"); setTxError(""); setMintAddress(""); setSig("");
  }

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  return (
    <div className="app-page">
      <div className="wizard-wrap">
        {/* Progress bar */}
        <div className="wizard-progress">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`wizard-step-dot ${i + 1 < step ? "done" : i + 1 === step ? "active" : ""}`}
              onClick={() => { if (i + 1 < step) setStep(i + 1); }}
              title={label}
            >
              <span className="wizard-step-num">{i + 1 < step ? "✓" : i + 1}</span>
              <span className="wizard-step-label">{label}</span>
            </div>
          ))}
          <div className="wizard-progress-track">
            <div className="wizard-progress-fill" style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="wizard-body">
          {/* ── Step 1: Connect ── */}
          {step === 1 && (
            <WizardCard title="Connect your wallet" subtitle="Connect a Solana wallet to continue.">
              {publicKey ? (
                <div className="wallet-connected-info">
                  <span className="wallet-chip-dot" />
                  <span className="lp-mono">{publicKey.toBase58().slice(0, 8)}…{publicKey.toBase58().slice(-8)}</span>
                </div>
              ) : (
                <div className="wallet-options">
                  <button className="wallet-option-btn" onClick={() => setVisible(true)}>
                    <span className="wallet-option-icon">◎</span>
                    Connect Wallet
                  </button>
                </div>
              )}
              <WizardNav onNext={publicKey ? next : undefined} nextLabel="Continue" />
            </WizardCard>
          )}

          {/* ── Step 2: Basics ── */}
          {step === 2 && (
            <WizardCard
              title="Token basics"
              subtitle={prefilled ? "Pre-filled from homepage — review and adjust." : "Name and supply define your token on-chain."}
            >
              <div className="wizard-form-grid">
                <FormField label="Token name" required>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value.slice(0, 30) })}
                    placeholder="e.g. My Token"
                    maxLength={30}
                  />
                </FormField>
                <FormField label="Symbol" required hint="Permanent — cannot change after creation">
                  <input
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase().slice(0, 10) })}
                    placeholder="e.g. MTK"
                    maxLength={10}
                  />
                </FormField>
                <FormField label="Total supply" required>
                  <input
                    type="number"
                    value={form.supply}
                    onChange={(e) => setForm({ ...form, supply: e.target.value })}
                    min="1"
                  />
                </FormField>
                <FormField label="Decimals" hint="9 is standard for SPL tokens">
                  <input
                    type="number"
                    min="0"
                    max="9"
                    value={form.decimals}
                    onChange={(e) => setForm({ ...form, decimals: e.target.value })}
                  />
                </FormField>
              </div>
              <WizardNav onBack={back} onNext={form.name && form.symbol ? next : undefined} />
            </WizardCard>
          )}

          {/* ── Step 3: Branding ── */}
          {step === 3 && (
            <WizardCard title="Branding & metadata" subtitle="Add a logo, description, and social links.">
              <div className="wizard-form-grid">
                <FormField label="Logo" hint="PNG, JPG, or WebP — max 2 MB, 1:1 ratio recommended" className="wizard-col-full">
                  <div
                    className="logo-upload-zone"
                    onClick={() => fileRef.current?.click()}
                    style={{ cursor: "pointer" }}
                  >
                    {logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="logo preview" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
                    ) : (
                      <>
                        <span className="logo-upload-icon">+</span>
                        <span>Drag & drop or click to upload</span>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: "none" }}
                    onChange={handleLogoChange}
                  />
                  {uploadError && <p className="tool-error" style={{ marginTop: 4 }}>{uploadError}</p>}
                </FormField>
                <FormField label="Description" className="wizard-col-full">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    placeholder="Describe your token…"
                  />
                </FormField>
                <FormField label="Website">
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://…" />
                </FormField>
                <FormField label="X (Twitter)">
                  <input value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} placeholder="https://x.com/…" />
                </FormField>
                <FormField label="Telegram">
                  <input value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="https://t.me/…" />
                </FormField>
              </div>
              <WizardNav onBack={back} onNext={next} />
            </WizardCard>
          )}

          {/* ── Step 4: Advanced ── */}
          {step === 4 && (
            <WizardCard title="Advanced settings" subtitle="Token standard and authority controls.">
              <div className="wizard-advanced">
                <div className="wizard-toggle-group">
                  <span className="wizard-toggle-label">Token standard</span>
                  <div className="wizard-seg">
                    <button className={form.standard === "spl" ? "active" : ""} onClick={() => setForm({ ...form, standard: "spl" })}>SPL</button>
                    <button className={form.standard === "token2022" ? "active" : ""} onClick={() => setForm({ ...form, standard: "token2022" })}>Token-2022</button>
                  </div>
                </div>
                <div className="wizard-divider" />
                <ToggleRow label="Revoke mint authority" hint="Permanently cap supply — +0.05 SOL" checked={form.revokeMint} onChange={(v) => setForm({ ...form, revokeMint: v })} />
                <ToggleRow label="Revoke freeze authority" hint="No wallet can ever be frozen — +0.05 SOL" checked={form.revokeFreeze} onChange={(v) => setForm({ ...form, revokeFreeze: v })} />
                <ToggleRow label="Make immutable" hint="Lock metadata permanently — Free" checked={form.revokeUpdate} onChange={(v) => setForm({ ...form, revokeUpdate: v })} />
              </div>
              <WizardNav onBack={back} onNext={next} />
            </WizardCard>
          )}

          {/* ── Step 5: Review ── */}
          {step === 5 && (
            <WizardCard title="Review your token" subtitle="Confirm details before signing. Some fields are permanent.">
              <div className="review-grid">
                <ReviewRow label="Name" value={form.name || "—"} />
                <ReviewRow label="Symbol" value={form.symbol || "—"} permanent />
                <ReviewRow label="Supply" value={Number(form.supply).toLocaleString()} />
                <ReviewRow label="Decimals" value={form.decimals} />
                <ReviewRow label="Standard" value={form.standard === "token2022" ? "Token-2022" : "SPL"} />
                <ReviewRow label="Mint authority" value={form.revokeMint ? "Will be revoked" : "Active"} />
                <ReviewRow label="Freeze authority" value={form.revokeFreeze ? "Will be revoked" : "Active"} />
                <ReviewRow label="Update authority" value={form.revokeUpdate ? "Will be revoked (immutable)" : "Active"} />
                {logoFile && <ReviewRow label="Logo" value={logoFile.name} />}
              </div>
              <div className="cost-summary">
                <div className="cost-summary-title">Cost summary</div>
                <div className="cost-row"><span>Base fee</span><span className="lp-mono">0.1 SOL</span></div>
                {form.revokeMint && <div className="cost-row"><span>Revoke mint authority</span><span className="lp-mono">0.05 SOL</span></div>}
                {form.revokeFreeze && <div className="cost-row"><span>Revoke freeze authority</span><span className="lp-mono">0.05 SOL</span></div>}
                {form.revokeUpdate && <div className="cost-row"><span>Make immutable</span><span className="lp-mono">Free</span></div>}
                <div className="cost-row"><span>Network rent (est.)</span><span className="lp-mono">~0.002 SOL</span></div>
                <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~{totalFee.toFixed(3)} SOL</span></div>
              </div>
              <div className="wizard-actions">
                <button className="lp-btn lp-btn--secondary" onClick={back}>Back</button>
                <button className="lp-btn lp-btn--primary" onClick={handleCreate}>
                  {publicKey ? "Create token" : "Connect wallet"}
                </button>
              </div>
            </WizardCard>
          )}

          {/* ── Step 6: Sign / Success / Fail ── */}
          {step === 6 && (
            <WizardCard title={txState === "confirmed" ? "Token created!" : txState === "failed" ? "Transaction failed" : "Signing…"}>
              <div className="tx-state">
                {txState === "building" && <TxStep label="Building transaction & uploading metadata…" active />}
                {txState === "sign" && <TxStep label="Sign in your wallet" active />}
                {txState === "submitting" && <TxStep label="Submitting to Solana…" active />}
                {txState === "confirming" && <TxStep label="Confirming…" active />}
                {txState === "confirmed" && (
                  <div className="tx-success">
                    <div className="tx-success-icon">✓</div>
                    <p className="tx-success-label">Token deployed successfully</p>
                    <div className="tx-mint">
                      <span className="lp-mono">{mintAddress}</span>
                      <button onClick={() => navigator.clipboard.writeText(mintAddress)} className="tx-copy-btn">Copy</button>
                    </div>
                    <a
                      className="lp-mono"
                      style={{ fontSize: "0.8em", marginTop: 8, display: "block" }}
                      href={`https://solscan.io/tx/${sig}?cluster=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View transaction on Solscan ↗
                    </a>
                    <a
                      className="lp-mono"
                      style={{ fontSize: "0.8em", marginTop: 4, display: "block" }}
                      href={`https://solscan.io/token/${mintAddress}?cluster=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View token on Solscan ↗
                    </a>
                    <div className="tx-success-actions">
                      <Link href="/pool" className="lp-btn lp-btn--primary">Add liquidity</Link>
                      <Link href={`/token/${mintAddress}`} className="lp-btn lp-btn--secondary">View token page</Link>
                      <button className="lp-btn lp-btn--secondary" onClick={resetWizard}>Create another</button>
                    </div>
                  </div>
                )}
                {txState === "failed" && (
                  <div className="tx-failed">
                    <p className="tool-error">{txError || "Transaction failed. Please try again."}</p>
                    <button className="lp-btn lp-btn--primary" onClick={() => { setStep(5); setTxState("idle"); }}>
                      Go back and retry
                    </button>
                  </div>
                )}
              </div>
            </WizardCard>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ── sub-components ── */

function WizardCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="wizard-card">
      <h1 className="wizard-card-title">{title}</h1>
      {subtitle && <p className="wizard-card-sub">{subtitle}</p>}
      {children}
    </div>
  );
}

function WizardNav({ onBack, onNext, nextLabel = "Next" }: { onBack?: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="wizard-actions">
      {onBack && <button className="lp-btn lp-btn--secondary" onClick={onBack}>Back</button>}
      {onNext && <button className="lp-btn lp-btn--primary" onClick={onNext}>{nextLabel}</button>}
    </div>
  );
}

function FormField({ label, hint, required, className, children }: { label: string; hint?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={`wizard-field ${className ?? ""}`}>
      <label className="wizard-field-label">
        {label}
        {required && <span className="wizard-req">*</span>}
        {hint && <span className="wizard-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-row-label">{label}</div>
        {hint && <div className="toggle-row-hint">{hint}</div>}
      </div>
      <button className={`toggle-switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked}>
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

function ReviewRow({ label, value, permanent }: { label: string; value: string; permanent?: boolean }) {
  return (
    <div className="review-row">
      <span className="review-label">{label} {permanent && <span className="wizard-warn-badge">permanent</span>}</span>
      <span className="review-value lp-mono">{value}</span>
    </div>
  );
}

function TxStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`tx-step ${active ? "active" : ""}`}>
      <span className="tx-step-spinner" />
      {label}
    </div>
  );
}
