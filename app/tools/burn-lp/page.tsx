import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

const BASE = "https://forge.solana.tools";

export const metadata: Metadata = {
  title: "Burn LP Tokens on Solana — Coming Soon — FORGE",
  description:
    "Permanently burn your LP position tokens to lock liquidity. This tool is in development and ships together with pool support for Raydium, Orca, and Meteora.",
  alternates: { canonical: `${BASE}/tools/burn-lp` },
};

const PROVIDERS = [
  { id: "raydium", name: "Raydium", desc: "CPMM and CLMM LP tokens." },
  { id: "orca", name: "Orca", desc: "Whirlpool position NFTs." },
  { id: "meteora", name: "Meteora", desc: "DLMM position tokens." },
];

export default function BurnLpPage() {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">Burn LP Tokens</h1>
            <span className="coming-soon-badge">Coming soon</span>
          </div>
          <p className="page-sub">
            Permanently burn your LP tokens to prove liquidity is locked — a strong trust signal for holders and DEX scanners.
          </p>
        </div>

        <div className="pool-section lp-card" data-reveal>
          <div className="pool-section-title">Coming soon</div>
          <p className="lp-body" style={{ marginBottom: "1rem" }}>
            LP burning ships together with pool support. Providers supported at launch:
          </p>
          <div className="dex-grid">
            {PROVIDERS.map((p) => (
              <div key={p.id} className="dex-card dex-card--soon">
                <div className="dex-card-name">{p.name}</div>
                <div className="dex-card-desc">{p.desc}</div>
                <span className="coming-soon-badge">Coming soon</span>
              </div>
            ))}
          </div>
          <p className="cost-summary-note" style={{ marginTop: "1rem" }}>
            Planned pricing: free — only Solana gas. Burning LP tokens is irreversible; the underlying liquidity stays in the pool forever.
          </p>
        </div>

        <div className="tools-cta lp-card" data-reveal>
          <h2 className="tools-cta-title">In the meantime</h2>
          <p className="lp-body">You can already burn regular tokens to reduce supply — that tool is live.</p>
          <div className="lp-actions">
            <Link href="/burn" className="lp-btn lp-btn--primary">Burn tokens</Link>
            <Link href="/tools" className="lp-btn lp-btn--secondary">All tools</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
