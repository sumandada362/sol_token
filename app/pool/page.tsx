import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { SITE_URL as BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Create Liquidity Pool on Solana — Coming Soon — Solana Token",
  description:
    "One-flow liquidity pool creation across Raydium, Orca, Meteora, and more is in development. Create your token now and add liquidity the moment pools go live.",
  alternates: { canonical: `${BASE}/pool` },
  openGraph: {
    title: "Create Liquidity Pool on Solana — Coming Soon — Solana Token",
    description: "One-flow pool creation across the major Solana DEXs is in development.",
    url: `${BASE}/pool`,
  },
};

const DEXES = [
  { id: "raydium", name: "Raydium", cost: "~0.50 SOL", desc: "Most volume. Best for new launches." },
  { id: "orca", name: "Orca", cost: "~0.40 SOL", desc: "Concentrated liquidity. Great UX." },
  { id: "meteora", name: "Meteora", cost: "~0.45 SOL", desc: "Dynamic pools. Strong for memecoins." },
  { id: "pumpswap", name: "PumpSwap", cost: "~0.40 SOL", desc: "Pump.fun native. Low barrier." },
  { id: "invariant", name: "Invariant", cost: "~0.45 SOL", desc: "Concentrated liquidity on Solana." },
  { id: "fluxbeam", name: "FluxBeam", cost: "~0.40 SOL", desc: "Token-2022 compatible pools." },
];

export default function PoolPage() {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header" data-reveal>
          <h1 className="page-title">Liquidity pools</h1>
          <p className="page-sub">Create pools across the major Solana DEXs in a single signing flow — in development.</p>
        </div>

        <div className="pool-tabs" data-reveal>
          <span className="pool-tab pool-tab--active">Create pool</span>
          <Link href="/pool/add" className="pool-tab">Add liquidity</Link>
          <Link href="/pool/remove" className="pool-tab">Remove liquidity</Link>
        </div>

        <div className="pool-section lp-card" data-reveal>
          <div className="pool-section-title">Pool providers</div>
          <div className="dex-grid">
            {DEXES.map((dex) => (
              <div key={dex.id} className="dex-card dex-card--soon">
                <div className="dex-card-name">{dex.name}</div>
                <div className="dex-card-cost lp-mono">{dex.cost} setup</div>
                <div className="dex-card-desc">{dex.desc}</div>
                <span className="coming-soon-badge">Coming soon</span>
              </div>
            ))}
          </div>
          {/* Planned pricing — kept for reference, intentionally NOT shown to users:
              flat 0.1 SOL Solana Token fee per pool; DEX setup costs (~0.4–0.6 SOL)
              go directly to the DEX protocol — never to Solana Token. */}
        </div>

        <div className="tools-cta lp-card" data-reveal>
          <h2 className="tools-cta-title">Launch-ready in the meantime</h2>
          <p className="lp-body">Create and configure your token today — pools will plug into the same wallet flow when they ship.</p>
          <div className="lp-actions">
            <Link href="/create-token" className="lp-btn lp-btn--primary">Create a token</Link>
            <Link href="/docs/add-liquidity" className="lp-btn lp-btn--secondary">Read the docs</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
