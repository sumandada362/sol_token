"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Footer from "@/components/Footer";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface FeeEvent {
  action: string;
  lamports: number;
  signature: string;
  mint: string | null;
  created_at: string;
}

interface SubRow {
  mint: string;
  starts_at: string;
  expires_at: string;
}

const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

export default function AccountPage() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [history, setHistory] = useState<FeeEvent[]>([]);
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!publicKey) { setHistory([]); setSubs([]); return; }
    const wallet = publicKey.toBase58();
    setLoading(true);

    Promise.all([
      fetch(`/api/tokens/wallet/${wallet}/fees`).then((r) => r.ok ? r.json() as Promise<FeeEvent[]> : []),
      fetch(`/api/subscriptions?wallet=${wallet}`).then((r) => r.ok ? r.json() as Promise<SubRow[]> : []),
    ])
      .then(([fees, subRows]) => {
        setHistory(fees);
        setSubs(subRows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [publicKey]);

  const address = publicKey?.toBase58() ?? "";

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header">
          <h1 className="page-title">Account</h1>
        </div>

        {/* Wallet panel */}
        <div className="lp-card account-wallet">
          <div className="account-section-title">Connected wallet</div>
          {connected ? (
            <>
              <div className="account-wallet-row">
                <div className="wallet-chip-dot" style={{ width: 10, height: 10 }} />
                <span className="lp-mono">{address}</span>
              </div>
              <div className="account-wallet-actions">
                <button className="lp-btn lp-btn--secondary" onClick={() => navigator.clipboard.writeText(address)}>
                  Copy address
                </button>
                <button className="lp-btn lp-btn--secondary" onClick={() => setVisible(true)}>
                  Change wallet
                </button>
                <a
                  href={`https://solscan.io/account/${address}?cluster=${NETWORK}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-link"
                >
                  View on Solscan →
                </a>
              </div>
              <div className="network-indicator">
                <span className="wallet-chip-net-dot" />
                {NETWORK.charAt(0).toUpperCase() + NETWORK.slice(1)}
              </div>
            </>
          ) : (
            <button className="lp-btn lp-btn--primary" onClick={() => setVisible(true)}>Connect wallet</button>
          )}
        </div>

        {/* Active subscriptions */}
        {subs.length > 0 && (
          <div className="dash-section">
            <h2 className="dash-section-title">Active subscriptions</h2>
            <div className="lp-card analytics-tx-table">
              <div className="analytics-tx-head">
                <span>Token</span><span>Started</span><span>Expires</span><span></span>
              </div>
              {subs.map((s) => (
                <div key={s.mint} className="analytics-tx-row">
                  <span className="lp-mono" style={{ fontSize: "0.8rem" }}>{s.mint.slice(0, 8)}…{s.mint.slice(-4)}</span>
                  <span style={{ fontSize: "0.82rem" }}>{new Date(s.starts_at).toLocaleDateString()}</span>
                  <span style={{ fontSize: "0.82rem" }}>{new Date(s.expires_at).toLocaleDateString()}</span>
                  <Link href={`/analytics/${s.mint}`} className="lp-link" style={{ fontSize: "0.82rem" }}>
                    Analytics →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fee history */}
        <div className="dash-section">
          <h2 className="dash-section-title">Fee &amp; transaction history</h2>
          {!connected ? (
            <div className="lp-card" style={{ padding: "1.5rem", color: "var(--lp-muted)", textAlign: "center" }}>
              Connect wallet to see history
            </div>
          ) : loading ? (
            <div className="lp-card" style={{ padding: "1.5rem", color: "var(--lp-muted)", textAlign: "center" }}>Loading…</div>
          ) : history.length === 0 ? (
            <div className="lp-card" style={{ padding: "1.5rem", color: "var(--lp-muted)", textAlign: "center" }}>No transactions yet</div>
          ) : (
            <div className="lp-card analytics-tx-table">
              <div className="analytics-tx-head">
                <span>Type</span><span>Amount</span><span>Date</span><span>Tx</span>
              </div>
              {history.map((h) => (
                <div key={h.signature} className="analytics-tx-row">
                  <span>{h.action}</span>
                  <span className="lp-mono">{(h.lamports / 1_000_000_000).toFixed(4)} SOL</span>
                  <span style={{ fontSize: "0.82rem" }}>{new Date(h.created_at).toLocaleDateString()}</span>
                  <a
                    href={`https://solscan.io/tx/${h.signature}?cluster=${NETWORK}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-link"
                    style={{ fontSize: "0.82rem" }}
                  >
                    Solscan ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {connected && (
          <div style={{ marginTop: "2rem" }}>
            <button className="lp-btn lp-btn--secondary" onClick={disconnect}>Disconnect wallet</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
