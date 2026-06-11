import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Dashboard — FORGE",
  description: "Manage your Solana tokens and pools.",
};

const myTokens = [
  { mint: "ABC3", name: "Forge Token", symbol: "FRGE", holders: 3201, liquidity: "45.0 SOL", status: "active" },
  { mint: "ABC1", name: "Solana Inu", symbol: "SINU", holders: 1240, liquidity: "12.4 SOL", status: "active" },
];

const activity = [
  { type: "Created", token: "FRGE", detail: "Token created", time: "2d ago" },
  { type: "Pool", token: "FRGE", detail: "Liquidity added on Raydium", time: "2d ago" },
  { type: "Pool", token: "SINU", detail: "Liquidity added on Orca", time: "5d ago" },
];

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
  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <Link href="/create-token" className="lp-btn lp-btn--primary">+ Create token</Link>
        </div>

        {/* Summary tiles */}
        <div className="dash-tiles">
          <DashTile label="Tokens" value={myTokens.length.toString()} />
          <DashTile label="Pools" value="3" />
          <DashTile label="Total holders" value="4,441" />
        </div>

        {/* My tokens */}
        <div className="dash-section">
          <h2 className="dash-section-title">My tokens</h2>
          {myTokens.length === 0 ? (
            <div className="dash-empty lp-card">
              <p>You haven&apos;t created any tokens yet.</p>
              <Link href="/create-token" className="lp-btn lp-btn--primary">Create your first token</Link>
            </div>
          ) : (
            <div className="dash-token-table">
              <div className="dash-table-head">
                <span>Token</span>
                <span>Holders</span>
                <span>Liquidity</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {myTokens.map((t) => (
                <div key={t.mint} className="dash-table-row">
                  <div className="dash-token-cell">
                    <div className="dash-token-avatar">{t.symbol.charAt(0)}</div>
                    <div>
                      <div className="dash-token-name">{t.name}</div>
                      <div className="dash-token-sym">{t.symbol}</div>
                    </div>
                  </div>
                  <div className="lp-mono">{t.holders.toLocaleString()}</div>
                  <div className="lp-mono">{t.liquidity}</div>
                  <div><span className="lp-pill lp-pill--ok">{t.status}</span></div>
                  <div className="dash-row-actions">
                    <Link href={`/pool?token=${t.mint}`} className="dash-action-btn">Pool</Link>
                    <Link href={`/burn?token=${t.mint}`} className="dash-action-btn">Burn</Link>
                    <Link href={`/token/${t.mint}`} className="dash-action-btn">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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

        {/* Recent activity */}
        <div className="dash-section">
          <h2 className="dash-section-title">Recent activity</h2>
          <div className="lp-card dash-activity">
            {activity.map((a, i) => (
              <div key={i} className="dash-activity-row">
                <span className={`dash-activity-type dash-activity-type--${a.type.toLowerCase()}`}>{a.type}</span>
                <span className="dash-activity-detail">{a.detail}</span>
                <span className="lp-mono dash-activity-sym">{a.token}</span>
                <span className="dash-activity-time">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function DashTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="dash-tile lp-card">
      <div className="dash-tile-value">{value}</div>
      <div className="dash-tile-label">{label}</div>
    </div>
  );
}
