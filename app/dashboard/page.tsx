"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useWallet } from "@solana/wallet-adapter-react";

interface TokenRow {
  mint: string;
  name: string | null;
  symbol: string | null;
  created_at: string;
}

interface SubRow {
  mint: string;
  expires_at: string;
}

const quickTools = [
  { href: "/tools/multisender", label: "Multisender", icon: "◈", desc: "Bulk send tokens" },
  { href: "/tools/mint-tokens", label: "Mint Tokens", icon: "⊕", desc: "Increase supply" },
  { href: "/tools/update-metadata", label: "Metadata", icon: "✎", desc: "Edit token info" },
  { href: "/tools/revoke-mint", label: "Revoke Mint", icon: "⊘", desc: "Cap supply" },
  { href: "/tools/revoke-freeze", label: "Revoke Freeze", icon: "⊗", desc: "Trust signal" },
  { href: "/tools/make-immutable", label: "Immutable", icon: "◻", desc: "Lock metadata" },
  { href: "/tools/market/create", label: "OpenBook", icon: "⬡", desc: "Create market" },
  { href: "/pool/add", label: "Add Liquidity", icon: "⊞", desc: "Top up pool" },
];

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [subs, setSubs] = useState<Map<string, string>>(new Map()); // mint → expires_at
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setTokens([]); setSubs(new Map()); return; }
    const wallet = publicKey.toBase58();
    setLoading(true);

    Promise.all([
      fetch(`/api/tokens/wallet/${wallet}`).then((r) => r.ok ? r.json() as Promise<TokenRow[]> : []),
      fetch(`/api/subscriptions?wallet=${wallet}`).then((r) => r.ok ? r.json() as Promise<SubRow[]> : []),
    ])
      .then(([toks, subRows]) => {
        setTokens(toks);
        const m = new Map<string, string>();
        for (const s of subRows) m.set(s.mint, s.expires_at);
        setSubs(m);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [publicKey]);

  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <Link href="/create-token" className="lp-btn lp-btn--primary">+ Create token</Link>
        </div>

        {!connected ? (
          <div className="lp-card" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ color: "var(--lp-muted)", marginBottom: "1rem" }}>Connect your wallet to see your tokens</p>
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="dash-tiles">
              <div className="dash-tile lp-card">
                <div className="dash-tile-value">{loading ? "…" : tokens.length}</div>
                <div className="dash-tile-label">Tokens</div>
              </div>
              <div className="dash-tile lp-card">
                <div className="dash-tile-value">{loading ? "…" : subs.size}</div>
                <div className="dash-tile-label">Active subscriptions</div>
              </div>
            </div>

            {/* My tokens */}
            <div className="dash-section">
              <h2 className="dash-section-title">My tokens</h2>
              {loading ? (
                <div className="lp-card" style={{ padding: "2rem", color: "var(--lp-muted)", textAlign: "center" }}>Loading…</div>
              ) : tokens.length === 0 ? (
                <div className="dash-empty lp-card">
                  <p>You haven&apos;t created any tokens yet.</p>
                  <Link href="/create-token" className="lp-btn lp-btn--primary">Create your first token</Link>
                </div>
              ) : (
                <div className="dash-token-table">
                  <div className="dash-table-head">
                    <span>Token</span>
                    <span>Analytics</span>
                    <span>Created</span>
                    <span>Actions</span>
                  </div>
                  {tokens.map((t) => {
                    const hasSub = subs.has(t.mint);
                    const expiry = subs.get(t.mint);
                    return (
                      <div key={t.mint} className="dash-table-row">
                        <div className="dash-token-cell">
                          <div className="dash-token-avatar">{(t.symbol ?? "?").charAt(0)}</div>
                          <div>
                            <div className="dash-token-name">{t.name ?? "Unknown"}</div>
                            <div className="dash-token-sym lp-mono" style={{ fontSize: "0.75rem" }}>
                              {t.mint.slice(0, 8)}…{t.mint.slice(-4)}
                            </div>
                          </div>
                        </div>
                        <div>
                          {hasSub ? (
                            <span className="lp-pill lp-pill--ok" style={{ fontSize: "0.75rem" }}>
                              Until {expiry ? new Date(expiry).toLocaleDateString() : "?"}
                            </span>
                          ) : (
                            <Link href={`/analytics/${t.mint}`} className="lp-pill lp-pill--info" style={{ fontSize: "0.75rem", textDecoration: "none" }}>
                              Unlock
                            </Link>
                          )}
                        </div>
                        <div style={{ fontSize: "0.82rem", color: "var(--lp-muted)" }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                        <div className="dash-row-actions">
                          <Link href={`/token/${t.mint}`} className="dash-action-btn">View</Link>
                          {hasSub && <Link href={`/analytics/${t.mint}`} className="dash-action-btn">Analytics</Link>}
                          <Link href={`/tools/multisender?mint=${t.mint}`} className="dash-action-btn">Send</Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Quick tools */}
        <div className="dash-section">
          <h2 className="dash-section-title">Quick tools</h2>
          <div className="dash-tools-grid">
            {quickTools.map((t) => (
              <Link key={t.href} href={t.href} className="dash-tool-card">
                <span className="dash-tool-icon">{t.icon}</span>
                <span className="dash-tool-label">{t.label}</span>
                <span className="dash-tool-desc">{t.desc}</span>
              </Link>
            ))}
          </div>
          <Link href="/tools" className="dash-all-tools-link">View all tools →</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
