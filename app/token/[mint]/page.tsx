import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export async function generateMetadata({ params }: { params: Promise<{ mint: string }> }): Promise<Metadata> {
  const { mint } = await params;
  return {
    title: `Token ${mint} — FORGE`,
    description: `Security, holders, and analytics for Solana token ${mint}.`,
  };
}

export default async function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;

  const token = {
    name: "Forge Token",
    symbol: "FRGE",
    mint,
    price: "$0.0042",
    marketCap: "$4,200,000",
    volume24h: "$320,000",
    liquidity: "45.0 SOL",
    holders: 3201,
    mintRevoked: true,
    freezeRevoked: true,
    updateActive: true,
    topHolder: 12,
    top10: 38,
  };

  return (
    <div className="app-page">
      <div className="page-wrap">
        {/* Token header */}
        <div className="token-header">
          <div className="token-avatar-lg">{token.symbol.charAt(0)}</div>
          <div className="token-header-info">
            <h1 className="token-header-name">{token.name}</h1>
            <div className="token-header-meta">
              <span className="token-symbol-badge">{token.symbol}</span>
              <span className="lp-mono token-mint-addr">{token.mint}</span>
              <button className="token-copy-btn" onClick={() => {}}>Copy</button>
            </div>
            <div className="token-socials">
              <a href="#" target="_blank" rel="noopener noreferrer" className="token-social-link">Website</a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="token-social-link">X</a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="token-social-link">Telegram</a>
            </div>
          </div>
          <div className="token-header-actions">
            <button className="lp-btn lp-btn--secondary token-share-btn">Share</button>
            <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="lp-link">View on Solscan →</a>
          </div>
        </div>

        {/* Stat row */}
        <div className="token-stats-row">
          {[
            { label: "Price", value: token.price },
            { label: "Market cap", value: token.marketCap },
            { label: "24h volume", value: token.volume24h },
            { label: "Liquidity", value: token.liquidity },
            { label: "Holders", value: token.holders.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="token-stat">
              <div className="token-stat-label">{label}</div>
              <div className="token-stat-value lp-mono">{value}</div>
            </div>
          ))}
        </div>

        {/* Security & Holders panel */}
        <div className="token-security-grid">
          <div className="lp-card">
            <div className="lp-card-title">Security</div>
            <div className="lp-card-row">
              <span>Mint authority</span>
              <span className={`lp-pill ${token.mintRevoked ? "lp-pill--ok" : "lp-pill--warn"}`}>
                {token.mintRevoked ? "Revoked" : "Active"}
              </span>
            </div>
            <div className="lp-card-row">
              <span>Freeze authority</span>
              <span className={`lp-pill ${token.freezeRevoked ? "lp-pill--ok" : "lp-pill--warn"}`}>
                {token.freezeRevoked ? "Revoked" : "Active"}
              </span>
            </div>
            <div className="lp-card-row">
              <span>Update authority</span>
              <span className={`lp-pill ${!token.updateActive ? "lp-pill--ok" : "lp-pill--warn"}`}>
                {token.updateActive ? "Active" : "Revoked"}
              </span>
            </div>
          </div>

          <div className="lp-card">
            <div className="lp-card-title">Holder concentration</div>
            <div className="lp-bar" style={{ marginBottom: "1.2rem" }}>
              <div className="lp-bar-head"><span>Top wallet</span><span className="lp-mono">{token.topHolder}%</span></div>
              <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: `${token.topHolder}%` }} /></div>
            </div>
            <div className="lp-bar">
              <div className="lp-bar-head"><span>Top 10 wallets</span><span className="lp-mono">{token.top10}%</span></div>
              <div className="lp-bar-track"><div className="lp-bar-fill" style={{ width: `${token.top10}%` }} /></div>
            </div>
            {token.top10 > 35 && (
              <div className="token-risk-flag">⚠ High concentration — top 10 hold more than 35%</div>
            )}
          </div>
        </div>

        {/* Mini chart placeholder */}
        <div className="lp-card token-chart">
          <div className="token-chart-header">
            <div className="token-chart-title">Price</div>
            <div className="token-chart-tabs">
              {["1H", "1D", "1W", "1M"].map((r) => (
                <button key={r} className={`token-chart-tab ${r === "1D" ? "active" : ""}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="token-chart-placeholder">
            <span>Chart — connect to live data source</span>
          </div>
        </div>

        {/* Actions */}
        <div className="token-actions">
          <Link href={`/pool?token=${mint}`} className="lp-btn lp-btn--primary">Add liquidity</Link>
          <Link href={`/burn?token=${mint}`} className="lp-btn lp-btn--secondary">Burn</Link>
          <div className="token-subscribe-box lp-card">
            <div className="token-subscribe-label">Deep analytics — price, volume, holder history</div>
            <Link href="/dashboard" className="lp-btn lp-btn--secondary">Subscribe — 0.5 SOL/yr</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
