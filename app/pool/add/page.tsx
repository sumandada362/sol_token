import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.dravyo.com";

export const metadata: Metadata = {
  title: "Add Liquidity on Solana — Coming Soon — Solana Token",
  description:
    "Deposit tokens into existing Raydium, Orca, or Meteora pools to earn trading fees. This tool is in development and ships together with pool creation.",
  alternates: { canonical: `${BASE}/pool/add` },
};

const PROVIDERS = [
  { id: "raydium", name: "Raydium", desc: "CPMM and CLMM pools." },
  { id: "orca", name: "Orca", desc: "Whirlpool positions." },
  { id: "meteora", name: "Meteora", desc: "DLMM and dynamic pools." },
];

export default function PoolAddPage() {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header" data-reveal>
          <h1 className="page-title">Add to Pool</h1>
          <p className="page-sub">Deposit tokens into an existing liquidity pool to earn fees.</p>
        </div>

        <div className="pool-tabs" data-reveal>
          <Link href="/pool" className="pool-tab">Create pool</Link>
          <span className="pool-tab pool-tab--active">Add liquidity</span>
          <Link href="/pool/remove" className="pool-tab">Remove liquidity</Link>
        </div>

        <div className="pool-section lp-card" data-reveal>
          <div className="pool-section-title">Coming soon</div>
          <p className="lp-body" style={{ marginBottom: "1rem" }}>
            Adding liquidity to existing pools ships together with pool creation. Providers supported at launch:
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
          {/* Planned pricing — kept for reference, intentionally NOT shown to users: 0.05 SOL per deposit. */}
          <p className="cost-summary-note" style={{ marginTop: "1rem" }}>
            Your token/SOL deposit becomes your LP position, not a fee.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
