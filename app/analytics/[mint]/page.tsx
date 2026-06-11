"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import bs58 from "bs58";

interface Overview {
  price: number | null;
  volume24h: number | null;
  liquidity: number | null;
  marketCap: number | null;
  priceChange24hPct: number | null;
}

interface OHLCVPoint { unixTime: number; open: number; close: number; high: number; low: number; volume: number }
interface HolderSnap { day: string; holders: number; top10_pct: number }
interface HourlyMetric { bucket: string; tx_count: number; buys: number; sells: number; volume: number }

interface AnalyticsPayload {
  tier: "free" | "paid";
  expiresAt?: string;
  overview: Overview;
  ohlcv?: OHLCVPoint[];
  holderHistory?: HolderSnap[];
  hourly?: HourlyMetric[];
  upsell?: { message: string; priceSol: number };
}

type AuthState = "idle" | "signing" | "fetching" | "error";

function fmt(n: number | null, prefix = "", suffix = "", dec = 2): string {
  if (n === null) return "—";
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(1)}B${suffix}`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M${suffix}`;
  if (n >= 1e3) return `${prefix}${(n / 1e3).toFixed(1)}K${suffix}`;
  return `${prefix}${n.toFixed(dec)}${suffix}`;
}

export default function AnalyticsPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = use(params);
  const wallet = useWallet();

  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [authState, setAuthState] = useState<AuthState>("idle");
  const [error, setError] = useState("");
  const [txState, setTxState] = useState<"idle" | "building" | "sign" | "confirming" | "done">("idle");

  const fetchData = useCallback(async (sig?: string, nonce?: string) => {
    if (!wallet.publicKey) return;
    const w = wallet.publicKey.toBase58();

    let queryStr = `wallet=${w}&nonce=${nonce ?? ""}&sig=${sig ?? ""}`;

    // If no auth params, do an unauthenticated free-tier fetch
    if (!sig || !nonce) {
      try {
        const res = await fetch(`/api/analytics/${mint}?wallet=${w}&nonce=&sig=`);
        const json = await res.json() as AnalyticsPayload;
        setData(json);
      } catch {
        setData(null);
      }
      return;
    }

    setAuthState("fetching");
    try {
      const res = await fetch(`/api/analytics/${mint}?${queryStr}`);
      const json = await res.json() as AnalyticsPayload;
      setData(json);
      setAuthState("idle");
    } catch {
      setError("Failed to load analytics");
      setAuthState("error");
    }
  }, [mint, wallet.publicKey]);

  useEffect(() => {
    if (wallet.publicKey) fetchData();
  }, [wallet.publicKey, fetchData]);

  async function handleAuth() {
    if (!wallet.publicKey || !wallet.signMessage) return;
    setAuthState("signing");
    setError("");
    try {
      const w = wallet.publicKey.toBase58();
      // Get nonce
      const nonceRes = await fetch(`/api/analytics/${mint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: w }),
      });
      const { nonce, message } = await nonceRes.json() as { nonce: string; message: string };

      // Sign message
      const msgBytes = new TextEncoder().encode(message);
      const sigBytes = await wallet.signMessage(msgBytes);
      const sig = bs58.encode(sigBytes);

      await fetchData(sig, nonce);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signing failed");
      setAuthState("error");
    }
  }

  async function handleSubscribe() {
    if (!wallet.publicKey || !wallet.sendTransaction) return;
    setTxState("building");
    setError("");
    try {
      const w = wallet.publicKey.toBase58();
      const buildRes = await fetch("/api/tx/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payer: w, mint }),
      });
      if (!buildRes.ok) throw new Error("Failed to build subscribe transaction");
      const { tx: txBase64 } = await buildRes.json() as { tx: string };

      setTxState("sign");
      const { Connection: Conn } = await import("@solana/web3.js");
      const conn = new Conn(process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");
      const tx = Transaction.from(Buffer.from(txBase64, "base64"));
      const sig = await wallet.sendTransaction(tx, conn);

      setTxState("confirming");
      await conn.confirmTransaction(sig, "confirmed");

      // Confirm server-side
      const confirmRes = await fetch("/api/tx/subscribe?action=confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: sig, payer: w, mint }),
      });
      if (!confirmRes.ok) throw new Error("Subscription confirmation failed");

      setTxState("done");
      // Refresh analytics with auth
      await handleAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Subscribe failed");
      setTxState("idle");
    }
  }

  const overview = data?.overview;

  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Analytics</h1>
            <Link href={`/token/${mint}`} className="tool-doc-link">← Token page</Link>
          </div>
          <p className="lp-mono" style={{ fontSize: "0.8rem", color: "var(--lp-muted)", marginTop: "0.5rem" }}>
            {mint}
          </p>
        </div>

        {/* Overview stats — free */}
        {overview && (
          <div className="token-stats-row" style={{ marginBottom: "2rem" }}>
            {[
              { label: "Price", value: fmt(overview.price, "$", "", 6) },
              { label: "24h change", value: overview.priceChange24hPct !== null ? `${overview.priceChange24hPct > 0 ? "+" : ""}${overview.priceChange24hPct.toFixed(2)}%` : "—" },
              { label: "Market cap", value: fmt(overview.marketCap, "$") },
              { label: "24h volume", value: fmt(overview.volume24h, "$") },
              { label: "Liquidity", value: fmt(overview.liquidity, "$") },
            ].map(({ label, value }) => (
              <div key={label} className="token-stat">
                <div className="token-stat-label">{label}</div>
                <div className="token-stat-value lp-mono">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Paid content */}
        {!wallet.connected ? (
          <div className="lp-card" style={{ textAlign: "center", padding: "2.5rem" }}>
            <p style={{ marginBottom: "1rem", color: "var(--lp-muted)" }}>Connect your wallet to view analytics</p>
          </div>
        ) : data?.tier === "paid" ? (
          <>
            {/* Subscription info */}
            {data.expiresAt && (
              <div className="lp-card" style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.88rem", color: "var(--lp-muted)" }}>Subscription active</span>
                <span className="lp-mono" style={{ fontSize: "0.82rem" }}>
                  Expires {new Date(data.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* OHLCV chart placeholder */}
            {data.ohlcv && data.ohlcv.length > 0 && (
              <div className="lp-card token-chart" style={{ marginBottom: "1.5rem" }}>
                <div className="token-chart-header">
                  <div className="token-chart-title">Price (1H candles)</div>
                  <span className="lp-mono" style={{ fontSize: "0.8rem", color: "var(--lp-muted)" }}>{data.ohlcv.length} points</span>
                </div>
                <div style={{ padding: "1.5rem", display: "flex", alignItems: "flex-end", gap: "2px", height: "120px", overflow: "hidden" }}>
                  {data.ohlcv.slice(-60).map((c) => {
                    const max = Math.max(...data.ohlcv!.slice(-60).map((x) => x.high));
                    const min = Math.min(...data.ohlcv!.slice(-60).map((x) => x.low));
                    const range = max - min || 1;
                    const h = ((c.close - min) / range) * 100;
                    const isUp = c.close >= c.open;
                    return (
                      <div
                        key={c.unixTime}
                        style={{
                          flex: 1,
                          height: `${h}%`,
                          minHeight: "2px",
                          background: isUp ? "var(--lp-success, #22c55e)" : "var(--lp-danger, #ef4444)",
                          borderRadius: "1px",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Holder growth */}
            {data.holderHistory && data.holderHistory.length > 0 && (
              <div className="lp-card" style={{ marginBottom: "1.5rem" }}>
                <div className="lp-card-title">Holder growth (90 days)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "80px", marginTop: "1rem", overflow: "hidden" }}>
                  {data.holderHistory.slice().reverse().map((s) => {
                    const max = Math.max(...data.holderHistory!.map((x) => x.holders));
                    const h = max ? (s.holders / max) * 100 : 0;
                    return (
                      <div key={s.day} style={{ flex: 1, height: `${h}%`, minHeight: "2px", background: "var(--lp-accent, #6366f1)", borderRadius: "1px" }} />
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--lp-muted)" }}>
                  <span>{data.holderHistory[data.holderHistory.length - 1]?.day}</span>
                  <span>{data.holderHistory[0]?.holders?.toLocaleString()} holders</span>
                </div>
              </div>
            )}

            {/* Buy/Sell activity */}
            {data.hourly && data.hourly.length > 0 && (
              <div className="lp-card" style={{ marginBottom: "1.5rem" }}>
                <div className="lp-card-title">Trading activity (last 30 days)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                  {[
                    { label: "Total transactions", value: data.hourly.reduce((s, h) => s + (h.tx_count ?? 0), 0).toLocaleString() },
                    { label: "Buys", value: data.hourly.reduce((s, h) => s + (h.buys ?? 0), 0).toLocaleString() },
                    { label: "Sells", value: data.hourly.reduce((s, h) => s + (h.sells ?? 0), 0).toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="token-stat">
                      <div className="token-stat-label">{label}</div>
                      <div className="token-stat-value lp-mono">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSV export */}
            <div className="lp-card">
              <div className="lp-card-title">Export data</div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
                <a
                  href={`/api/analytics/${mint}/csv?wallet=${wallet.publicKey?.toBase58()}`}
                  className="lp-btn lp-btn--secondary"
                  style={{ fontSize: "0.85rem" }}
                >
                  Download CSV
                </a>
              </div>
            </div>
          </>
        ) : data?.tier === "free" ? (
          <div className="lp-card" style={{ textAlign: "center", padding: "2.5rem" }}>
            <div className="lp-card-title" style={{ marginBottom: "0.75rem" }}>Unlock Analytics</div>
            <p style={{ color: "var(--lp-muted)", marginBottom: "1.25rem", maxWidth: "420px", margin: "0 auto 1.5rem" }}>
              {data.upsell?.message ?? "Unlock 1 year of price history, holder growth, buy/sell data, and CSV export."}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="lp-btn lp-btn--primary" onClick={handleAuth} disabled={authState === "signing" || authState === "fetching"}>
                {authState === "signing" ? "Sign message…" : authState === "fetching" ? "Checking…" : "Check my subscription"}
              </button>
              {txState === "done" ? (
                <span className="lp-pill lp-pill--ok">Subscribed!</span>
              ) : (
                <button className="lp-btn lp-btn--secondary" onClick={handleSubscribe}
                  disabled={txState !== "idle"}>
                  {txState === "idle" ? `Subscribe — 0.5 SOL/yr` :
                   txState === "building" ? "Building tx…" :
                   txState === "sign" ? "Sign in wallet…" :
                   txState === "confirming" ? "Confirming…" : "Processing…"}
                </button>
              )}
            </div>
            {error && <p style={{ color: "var(--lp-danger, #ef4444)", marginTop: "1rem", fontSize: "0.85rem" }}>{error}</p>}
          </div>
        ) : (
          <div className="lp-card" style={{ textAlign: "center", padding: "2.5rem" }}>
            <p style={{ color: "var(--lp-muted)" }}>Loading analytics…</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
