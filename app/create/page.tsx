"use client";
import type { Metadata } from "next";
import Link from "next/link";
import { useState } from "react";
import Footer from "@/components/Footer";

const STEPS = ["Connect", "Basics", "Branding", "Advanced", "Review", "Sign"];

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [txState, setTxState] = useState<"idle" | "building" | "sign" | "submitting" | "confirming" | "confirmed" | "failed">("idle");

  const [form, setForm] = useState({
    name: "", symbol: "", supply: "1000000000", decimals: "9",
    description: "", website: "", twitter: "", telegram: "",
    standard: "spl" as "spl" | "token2022",
    revokeMint: false, revokeFreeze: false, revokeUpdate: false,
    vanityAddress: false,
  });

  function next() { if (step < 5) setStep((s) => s + 1); }
  function back() { if (step > 1) setStep((s) => s - 1); }

  function handleCreate() {
    setStep(6);
    setTxState("building");
    setTimeout(() => setTxState("sign"), 1000);
    setTimeout(() => setTxState("submitting"), 2500);
    setTimeout(() => setTxState("confirming"), 4000);
    setTimeout(() => setTxState("confirmed"), 5500);
  }

  const mintAddress = "7xKq3fBnMINTADDRESS1234567890ABCD";

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
            <WizardCard title="Connect your wallet" subtitle="Choose a wallet to continue.">
              <div className="wallet-options">
                {["Phantom", "Solflare", "Backpack"].map((w) => (
                  <button key={w} className="wallet-option-btn" onClick={next}>
                    <span className="wallet-option-icon">◎</span>
                    {w}
                  </button>
                ))}
              </div>
              <WizardNav onNext={next} nextLabel="Continue" />
            </WizardCard>
          )}

          {/* ── Step 2: Basics ── */}
          {step === 2 && (
            <WizardCard title="Token basics" subtitle="Name and supply define your token on-chain.">
              <div className="wizard-form-grid">
                <FormField label="Token name" required>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. My Token" />
                </FormField>
                <FormField label="Symbol" required hint="Permanent — cannot change after creation">
                  <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase().slice(0, 10) })} placeholder="e.g. MTK" />
                </FormField>
                <FormField label="Total supply" required>
                  <input type="number" value={form.supply} onChange={(e) => setForm({ ...form, supply: e.target.value })} />
                </FormField>
                <FormField label="Decimals" hint="9 is standard for SPL tokens">
                  <input type="number" min="0" max="18" value={form.decimals} onChange={(e) => setForm({ ...form, decimals: e.target.value })} />
                </FormField>
              </div>
              <WizardNav onBack={back} onNext={next} />
            </WizardCard>
          )}

          {/* ── Step 3: Branding ── */}
          {step === 3 && (
            <WizardCard title="Branding & metadata" subtitle="Add a logo, description, and social links.">
              <div className="wizard-form-grid">
                <FormField label="Logo" hint="PNG, JPG, or SVG — 1:1 ratio recommended" className="wizard-col-full">
                  <div className="logo-upload-zone">
                    <span className="logo-upload-icon">+</span>
                    <span>Drag & drop or click to upload</span>
                  </div>
                </FormField>
                <FormField label="Description" className="wizard-col-full">
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Describe your token…" />
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
                <ToggleRow label="Revoke mint authority" hint="Prevents new supply from ever being minted" checked={form.revokeMint} onChange={(v) => setForm({ ...form, revokeMint: v })} />
                <ToggleRow label="Revoke freeze authority" hint="Prevents any wallet from being frozen" checked={form.revokeFreeze} onChange={(v) => setForm({ ...form, revokeFreeze: v })} />
                <ToggleRow label="Revoke update authority" hint="Prevents metadata from being changed" checked={form.revokeUpdate} onChange={(v) => setForm({ ...form, revokeUpdate: v })} />
                <div className="wizard-divider" />
                <ToggleRow label="Vanity address" hint="Generate an address starting with custom characters — may take several minutes" checked={form.vanityAddress} onChange={(v) => setForm({ ...form, vanityAddress: v })} warn />
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
                <ReviewRow label="Update authority" value={form.revokeUpdate ? "Will be revoked" : "Active"} />
              </div>
              <div className="cost-summary">
                <div className="cost-summary-title">Cost summary</div>
                <div className="cost-row"><span>Platform fee</span><span className="lp-mono">0.1 SOL</span></div>
                <div className="cost-row"><span>Network rent (est.)</span><span className="lp-mono">~0.002 SOL</span></div>
                <div className="cost-row cost-row--total"><span>Total</span><span className="lp-mono">~0.102 SOL</span></div>
              </div>
              <div className="wizard-actions">
                <button className="lp-btn lp-btn--secondary" onClick={back}>Back</button>
                <button className="lp-btn lp-btn--primary" onClick={handleCreate}>Create token</button>
              </div>
            </WizardCard>
          )}

          {/* ── Step 6: Sign / Success ── */}
          {step === 6 && (
            <WizardCard title={txState === "confirmed" ? "Token created!" : "Signing…"}>
              <div className="tx-state">
                {txState === "building" && <TxStep label="Building transaction…" active />}
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
                    <div className="tx-success-actions">
                      <Link href="/pool" className="lp-btn lp-btn--primary">Add liquidity</Link>
                      <Link href={`/token/${mintAddress}`} className="lp-btn lp-btn--secondary">View token page</Link>
                      <button className="lp-btn lp-btn--secondary" onClick={() => { setStep(1); setForm({ name: "", symbol: "", supply: "1000000000", decimals: "9", description: "", website: "", twitter: "", telegram: "", standard: "spl", revokeMint: false, revokeFreeze: false, revokeUpdate: false, vanityAddress: false }); setTxState("idle"); }}>Create another</button>
                    </div>
                  </div>
                )}
                {txState === "failed" && (
                  <div className="tx-failed">
                    <p>Transaction failed. Please try again.</p>
                    <button className="lp-btn lp-btn--primary" onClick={handleCreate}>Retry</button>
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

function ToggleRow({ label, hint, checked, onChange, warn }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; warn?: boolean }) {
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-row-label">{label} {warn && <span className="wizard-warn-badge">⚠ slow</span>}</div>
        {hint && <div className="toggle-row-hint">{hint}</div>}
      </div>
      <button
        className={`toggle-switch ${checked ? "on" : ""}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
      >
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
