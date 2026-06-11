"use client";

import Link from "next/link";
import { useState, useRef, useCallback } from "react";
import Footer from "@/components/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey } from "@solana/web3.js";
import { Connection } from "@solana/web3.js";

interface ParsedRow { address: string; amount: string; error?: string }
interface BatchInfo { index: number; tx: string; lastValidBlockHeight: number; recipientCount: number; platformFeeLamports: number }
interface Quote { platformFeeSol: number; ataRentSol: number; networkFeeSol: number; totalSol: number; ataCreations: number; recipientCount: number }
interface MultisendResponse { uploadHash: string; batches: BatchInfo[]; quote: Quote }

const JOURNAL_KEY = (hash: string) => `multisend:journal:${hash}`;

interface JournalEntry { index: number; status: "pending" | "confirmed" | "failed"; signature?: string }
function loadJournal(hash: string): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY(hash)) ?? "[]") as JournalEntry[]; } catch { return []; }
}
function saveJournal(hash: string, entries: JournalEntry[]) {
  try { localStorage.setItem(JOURNAL_KEY(hash), JSON.stringify(entries)); } catch {}
}

function parseCSVText(text: string): ParsedRow[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      const address = parts[0] ?? "";
      const amount = parts[1] ?? "";
      let error: string | undefined;
      if (address.length < 32) error = "Invalid address";
      else if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) error = "Invalid amount";
      // Block formula injection
      else if (/^[=+\-@]/.test(amount)) error = "Invalid amount";
      return { address, amount, error };
    });
}

type Phase = "input" | "quoting" | "quoted" | "sending" | "done";

export default function MultisenderPage() {
  const wallet = useWallet();
  const [mintInput, setMintInput] = useState("");
  const [decimals, setDecimals] = useState(9);
  const [csvText, setCsvText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [response, setResponse] = useState<MultisendResponse | null>(null);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const rows = parseCSVText(csvText);
  const validRows = rows.filter((r) => !r.error);
  const invalidCount = rows.length - validRows.length;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Cap at ~10MB
    if (file.size > 10 * 1024 * 1024) { setError("File too large (max 10MB / 10k rows)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? "";
      const lines = text.split("\n").slice(0, 10_001);
      if (lines.length > 10_000) { setError("Max 10,000 recipients"); return; }
      setCsvText(lines.join("\n"));
    };
    reader.readAsText(file);
  }

  const handleQuote = useCallback(async () => {
    if (!wallet.publicKey) { setError("Connect wallet first"); return; }
    if (validRows.length === 0) { setError("No valid recipients"); return; }
    if (validRows.length > 10_000) { setError("Max 10,000 recipients"); return; }
    if (!mintInput || mintInput.length < 32) { setError("Enter a valid token mint address"); return; }

    try { new PublicKey(mintInput); } catch { setError("Invalid mint address"); return; }

    setError("");
    setPhase("quoting");

    try {
      const res = await fetch("/api/tx/multisend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer: wallet.publicKey.toBase58(),
          mint: mintInput,
          decimals,
          recipients: validRows.map((r) => ({ address: r.address, amount: r.amount })),
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        throw new Error(err.error);
      }
      const data = await res.json() as MultisendResponse;
      setResponse(data);

      // Check for existing journal (resumable)
      const existing = loadJournal(data.uploadHash);
      if (existing.length > 0) {
        setJournal(existing);
      } else {
        const fresh = data.batches.map((b) => ({ index: b.index, status: "pending" as const }));
        setJournal(fresh);
        saveJournal(data.uploadHash, fresh);
      }

      setPhase("quoted");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quote failed");
      setPhase("input");
    }
  }, [wallet.publicKey, validRows, mintInput, decimals]);

  const handleSend = useCallback(async () => {
    if (!response || !wallet.publicKey || !wallet.sendTransaction) return;
    setPhase("sending");
    setError("");

    const conn = new Connection(process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");

    let updatedJournal = [...journal];

    for (const batch of response.batches) {
      const entry = updatedJournal.find((j) => j.index === batch.index);
      if (entry?.status === "confirmed") {
        setCurrentBatch(batch.index + 1);
        continue;
      }

      try {
        const tx = Transaction.from(Buffer.from(batch.tx, "base64"));
        const sig = await wallet.sendTransaction(tx, conn);
        await conn.confirmTransaction({ signature: sig, blockhash: tx.recentBlockhash!, lastValidBlockHeight: batch.lastValidBlockHeight }, "confirmed");

        updatedJournal = updatedJournal.map((j) =>
          j.index === batch.index ? { ...j, status: "confirmed", signature: sig } : j
        );
        saveJournal(response.uploadHash, updatedJournal);
        setJournal([...updatedJournal]);
        setCurrentBatch(batch.index + 1);
      } catch (e) {
        updatedJournal = updatedJournal.map((j) =>
          j.index === batch.index ? { ...j, status: "failed" } : j
        );
        saveJournal(response.uploadHash, updatedJournal);
        setJournal([...updatedJournal]);
        setError(`Batch ${batch.index + 1} failed: ${e instanceof Error ? e.message : String(e)}`);
        setPhase("quoted");
        return;
      }
    }

    setPhase("done");
    // Clear journal on success
    if (response) localStorage.removeItem(JOURNAL_KEY(response.uploadHash));
  }, [response, wallet, journal]);

  const q = response?.quote;
  const confirmedCount = journal.filter((j) => j.status === "confirmed").length;
  const totalBatches = response?.batches.length ?? 0;
  const hasResumable = journal.some((j) => j.status === "confirmed") && journal.some((j) => j.status === "pending");

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Multisender</h1>
            <div className="tool-fee-badge">0.001 SOL/recipient</div>
          </div>
          <p className="page-sub">Bulk-send any SPL token to up to 10,000 wallets in one batched signing flow.</p>
          <div className="tool-header-links">
            <Link href="/blog/how-to-bulk-send-solana-tokens" className="tool-doc-link">Guide</Link>
            <Link href="/docs/multisender" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        {phase === "done" ? (
          <div className="tx-success lp-card">
            <div className="tx-success-icon">✓</div>
            <p className="tx-success-label">Tokens sent to {q?.recipientCount ?? 0} wallets across {totalBatches} transactions</p>
            <div className="tx-success-actions">
              <button className="lp-btn lp-btn--secondary" onClick={() => { setPhase("input"); setCsvText(""); setResponse(null); setJournal([]); setMintInput(""); }}>
                Send again
              </button>
              <Link href="/dashboard" className="lp-btn lp-btn--primary">Dashboard</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1 — Token */}
            <div className="lp-card pool-section">
              <div className="pool-section-title">1. Token mint address</div>
              <input
                className="wizard-input"
                placeholder="Token mint address…"
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
                disabled={phase !== "input"}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", color: "var(--lp-muted)" }}>Decimals:</label>
                <input
                  type="number"
                  min={0}
                  max={9}
                  className="wizard-input"
                  style={{ width: "80px" }}
                  value={decimals}
                  onChange={(e) => setDecimals(Math.max(0, Math.min(9, parseInt(e.target.value) || 0)))}
                  disabled={phase !== "input"}
                />
              </div>
            </div>

            {/* Step 2 — Recipients */}
            <div className="lp-card pool-section">
              <div className="pool-section-title">2. Recipients</div>
              <p className="multisender-hint">
                One per line: <code>wallet_address, amount</code> — or upload a CSV file.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <button
                  className="lp-btn lp-btn--secondary"
                  style={{ fontSize: "0.82rem" }}
                  onClick={() => fileRef.current?.click()}
                  disabled={phase !== "input"}
                >
                  Upload CSV
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFile} />
                {csvText && phase === "input" && (
                  <button className="lp-btn lp-btn--secondary" style={{ fontSize: "0.82rem" }} onClick={() => setCsvText("")}>Clear</button>
                )}
              </div>
              <textarea
                className="multisender-textarea wizard-input"
                rows={8}
                placeholder={`7xKq9mFnBvAa...wallet1, 100\n8yLr0nGoCwBb...wallet2, 250\n9zMs1oHpDxCc...wallet3, 500`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                disabled={phase !== "input"}
              />
              <div className="multisender-stats">
                <span>{rows.length} rows</span>
                <span style={validRows.length < rows.length ? { color: "var(--lp-warn, #f59e0b)" } : {}}>
                  {validRows.length} valid
                </span>
                {invalidCount > 0 && (
                  <span style={{ color: "var(--lp-warn, #f59e0b)" }}>{invalidCount} invalid</span>
                )}
              </div>
              {/* Show first few errors */}
              {rows.filter((r) => r.error).slice(0, 3).map((r, i) => (
                <div key={i} style={{ fontSize: "0.78rem", color: "var(--lp-danger, #ef4444)", marginTop: "0.25rem" }}>
                  Row {rows.indexOf(r) + 1}: {r.error} ({r.address.slice(0, 12)}…)
                </div>
              ))}
            </div>

            {/* Quote */}
            {q && (
              <div className="cost-summary lp-card">
                <div className="cost-summary-title">
                  Cost summary
                  {hasResumable && <span className="lp-pill lp-pill--ok" style={{ marginLeft: "0.75rem", fontSize: "0.75rem" }}>Resumable — {confirmedCount}/{totalBatches} batches done</span>}
                </div>
                {[
                  { label: `Platform fee (${q.recipientCount} × 0.001 SOL)`, val: `${q.platformFeeSol.toFixed(4)} SOL` },
                  { label: `ATA rent (${q.ataCreations} new accounts × ~0.002 SOL)`, val: `~${q.ataRentSol.toFixed(4)} SOL` },
                  { label: "Network fees", val: `~${q.networkFeeSol.toFixed(4)} SOL` },
                  { label: "Batches", val: `${totalBatches} transactions` },
                ].map(({ label, val }) => (
                  <div key={label} className="cost-row">
                    <span>{label}</span>
                    <span className="lp-mono">{val}</span>
                  </div>
                ))}
                <div className="cost-row cost-row--total">
                  <span>Total (est.)</span>
                  <span className="lp-mono">~{q.totalSol.toFixed(4)} SOL</span>
                </div>
              </div>
            )}

            {/* Progress during send */}
            {phase === "sending" && (
              <div className="lp-card" style={{ marginBottom: "1rem" }}>
                <div className="cost-summary-title">Sending — batch {currentBatch + 1} / {totalBatches}</div>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "0.75rem" }}>
                  {journal.map((j) => (
                    <div
                      key={j.index}
                      style={{
                        width: "28px", height: "28px", borderRadius: "6px", fontSize: "0.7rem",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: j.status === "confirmed" ? "var(--lp-success, #22c55e)" : j.status === "failed" ? "var(--lp-danger, #ef4444)" : j.index === currentBatch ? "var(--lp-accent, #6366f1)" : "rgba(255,255,255,0.1)",
                        color: "white",
                      }}
                    >
                      {j.index + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="lp-card" style={{ color: "var(--lp-danger, #ef4444)", fontSize: "0.85rem", padding: "1rem" }}>{error}</div>
            )}

            <div className="wizard-actions">
              {phase === "input" && (
                <button className="lp-btn lp-btn--primary" disabled={validRows.length === 0 || !wallet.connected} onClick={handleQuote}>
                  {wallet.connected ? "Get quote" : "Connect wallet to continue"}
                </button>
              )}
              {phase === "quoting" && (
                <div className="tx-state">
                  <div className="tx-step active"><span className="tx-step-spinner" /> Checking ATAs & building transactions…</div>
                </div>
              )}
              {phase === "quoted" && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button className="lp-btn lp-btn--secondary" onClick={() => setPhase("input")}>Edit</button>
                  <button className="lp-btn lp-btn--primary" onClick={handleSend}>
                    {hasResumable ? `Resume (${totalBatches - confirmedCount} batches left)` : `Send to ${validRows.length} wallets`}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
