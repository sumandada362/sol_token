import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import type { TokenPageData } from "@/lib/data/cache";

export const revalidate = 60;

async function fetchTokenData(mint: string): Promise<TokenPageData | null> {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/token/${mint}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json() as Promise<TokenPageData>;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ mint: string }> }): Promise<Metadata> {
  const { mint } = await params;
  const data = await fetchTokenData(mint);
  const name = data?.name ?? `Token ${mint.slice(0, 8)}…`;
  return {
    title: `${name} — FORGE`,
    description: `Security, holders, and analytics for Solana token ${mint}.`,
  };
}

const SEVERITY_CLASS: Record<string, string> = {
  critical: "lp-pill--danger",
  high: "lp-pill--warn",
  medium: "lp-pill--yellow",
  info: "lp-pill--info",
};

function fmt(n: number | null, opts?: { prefix?: string; suffix?: string; decimals?: number }): string {
  if (n === null) return "—";
  const { prefix = "", suffix = "", decimals = 2 } = opts ?? {};
  if (n >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(1)}B${suffix}`;
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M${suffix}`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K${suffix}`;
  return `${prefix}${n.toFixed(decimals)}${suffix}`;
}

export default async function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const token = await fetchTokenData(mint);

  const name = token?.name ?? `${mint.slice(0, 8)}…`;
  const symbol = token?.symbol ?? "???";

  return (
    <div className="app-page">
      <div className="page-wrap">

        {/* Token header */}
        <div className="token-header">
          <div className="token-avatar-lg">
            {token?.image
              ? <img src={token.image} alt={symbol} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              : symbol.charAt(0)
            }
          </div>
          <div className="token-header-info">
            <h1 className="token-header-name">{name}</h1>
            <div className="token-header-meta">
              <span className="token-symbol-badge">{symbol}</span>
              <span className="lp-mono token-mint-addr">{mint}</span>
            </div>
          </div>
          <div className="token-header-actions">
            <a
              href={`https://solscan.io/token/${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="lp-link"
            >
              View on Solscan →
            </a>
          </div>
        </div>

        {/* Stat row */}
        <div className="token-stats-row">
          {[
            { label: "Price", value: token ? fmt(token.price, { prefix: "$", decimals: 6 }) : "—" },
            { label: "Market cap", value: token ? fmt(token.marketCap, { prefix: "$" }) : "—" },
            { label: "24h volume", value: token ? fmt(token.volume24h, { prefix: "$" }) : "—" },
            { label: "Liquidity", value: token ? fmt(token.liquidity, { prefix: "$" }) : "—" },
            { label: "Holders", value: token?.totalHolders ? token.totalHolders.toLocaleString() : "—" },
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
              <span className={`lp-pill ${token?.mintAuthority === null ? "lp-pill--ok" : "lp-pill--warn"}`}>
                {!token ? "—" : token.mintAuthority === null ? "Revoked" : "Active"}
              </span>
            </div>
            <div className="lp-card-row">
              <span>Freeze authority</span>
              <span className={`lp-pill ${token?.freezeAuthority === null ? "lp-pill--ok" : "lp-pill--warn"}`}>
                {!token ? "—" : token.freezeAuthority === null ? "Revoked" : "Active"}
              </span>
            </div>
            <div className="lp-card-row">
              <span>Metadata</span>
              <span className={`lp-pill ${!token?.isMutable ? "lp-pill--ok" : "lp-pill--warn"}`}>
                {!token ? "—" : token.isMutable ? "Mutable" : "Immutable"}
              </span>
            </div>

            {/* Risk flags */}
            {token && token.riskFlags.length > 0 && (
              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {token.riskFlags.map((flag) => (
                  <div key={flag.id} className={`token-risk-flag token-risk-flag--${flag.severity}`}>
                    <span className={`lp-pill lp-pill--xs ${SEVERITY_CLASS[flag.severity] ?? "lp-pill--info"}`}>
                      {flag.severity}
                    </span>
                    {flag.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lp-card">
            <div className="lp-card-title">Holder concentration</div>
            <div className="lp-bar" style={{ marginBottom: "1.2rem" }}>
              <div className="lp-bar-head">
                <span>Top wallet</span>
                <span className="lp-mono">{token ? `${token.topHolderPct.toFixed(1)}%` : "—"}</span>
              </div>
              {token && (
                <div className="lp-bar-track">
                  <div className="lp-bar-fill" style={{ width: `${Math.min(100, token.topHolderPct)}%` }} />
                </div>
              )}
            </div>
            <div className="lp-bar">
              <div className="lp-bar-head">
                <span>Top 10 wallets</span>
                <span className="lp-mono">{token ? `${token.top10Pct.toFixed(1)}%` : "—"}</span>
              </div>
              {token && (
                <div className="lp-bar-track">
                  <div className="lp-bar-fill" style={{ width: `${Math.min(100, token.top10Pct)}%` }} />
                </div>
              )}
            </div>

            {/* Top 10 table */}
            {token && token.top10.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                {token.top10.slice(0, 5).map((h, i) => (
                  <div key={h.address} className="lp-card-row" style={{ fontSize: "0.78rem" }}>
                    <span className="lp-mono" style={{ color: "var(--lp-muted)" }}>
                      #{i + 1} {h.address.slice(0, 4)}…{h.address.slice(-4)}
                      {h.isPool && <span style={{ marginLeft: "0.4rem", opacity: 0.6 }}>(LP)</span>}
                    </span>
                    <span className="lp-mono">{h.pct.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="token-actions">
          <Link href={`/pool?token=${mint}`} className="lp-btn lp-btn--primary">Add liquidity</Link>
          <Link href={`/tools/multisender?mint=${mint}`} className="lp-btn lp-btn--secondary">Multisend</Link>
          <Link href={`/burn?token=${mint}`} className="lp-btn lp-btn--secondary">Burn</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
