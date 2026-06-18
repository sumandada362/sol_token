import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { SITE_URL as BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Remove Liquidity on Solana — Coming Soon — Solana Token",
  description:
    "Withdraw your share from Raydium, Orca, or Meteora liquidity pools. This tool is in development and ships together with pool creation.",
  alternates: { canonical: `${BASE}/pool/remove` },
};

const PROVIDERS = [
  { id: "raydium", name: "Raydium", desc: "CPMM and CLMM pools." },
  { id: "orca", name: "Orca", desc: "Whirlpool positions." },
  { id: "meteora", name: "Meteora", desc: "DLMM and dynamic pools." },
];

export default function PoolRemovePage() {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header" data-reveal>
          <h1 className="page-title">Remove from Pool</h1>
          <p className="page-sub">Withdraw your tokens and SOL from a liquidity position.</p>
        </div>

        <div className="pool-tabs" data-reveal>
          <Link href="/pool" className="pool-tab">Create pool</Link>
          <Link href="/pool/add" className="pool-tab">Add liquidity</Link>
          <span className="pool-tab pool-tab--active">Remove liquidity</span>
        </div>

        <div className="pool-section lp-card" data-reveal>
          <div className="pool-section-title">Coming soon</div>
          <p className="lp-body" style={{ marginBottom: "1rem" }}>
            Removing liquidity ships together with pool creation. Providers supported at launch:
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
          {/* Planned pricing — kept for reference, intentionally NOT shown to users: 0.05 SOL per withdrawal. */}
          <p className="cost-summary-note" style={{ marginTop: "1rem" }}>
            Your share of the pool returns to your wallet.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
