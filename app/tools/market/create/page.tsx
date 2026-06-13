import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.dravyo.com";

export const metadata: Metadata = {
  title: "Create OpenBook Market on Solana — Coming Soon — Solana Token",
  description:
    "OpenBook v2 order-book market creation for your Solana token is in development. Configure base/quote pair, tick size, and minimum order size in one flow.",
  alternates: { canonical: `${BASE}/tools/market/create` },
};

export default function MarketCreatePage() {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header" data-reveal>
          <div className="tool-header-meta">
            <h1 className="page-title">OpenBook Market</h1>
            <span className="coming-soon-badge">Coming soon</span>
          </div>
          <p className="page-sub">
            Create an OpenBook v2 order-book market for your token — required by some DEX integrations and trading interfaces.
          </p>
          <div className="tool-header-links">
            <Link href="/docs/openbook-market" className="tool-doc-link">Docs</Link>
          </div>
        </div>

        <div className="pool-section lp-card" data-reveal>
          <div className="pool-section-title">What&apos;s planned</div>
          <ul className="lp-body" style={{ lineHeight: 1.8, paddingLeft: "1.2rem" }}>
            <li>Base / quote pair selection (SOL, USDC, USDT quotes)</li>
            <li>Configurable minimum order size and tick size</li>
            <li>One transaction, signed from your browser wallet</li>
          </ul>
          <p className="cost-summary-note" style={{ marginTop: "1rem" }}>
            Planned pricing: 0.05 SOL Solana Token fee + ~2.85 SOL protocol deposit paid directly to OpenBook v2 for on-chain market accounts.
          </p>
        </div>

        <div className="tools-cta lp-card" data-reveal>
          <h2 className="tools-cta-title">In the meantime</h2>
          <p className="lp-body">Most DEXs no longer require an OpenBook market to trade your token — you can launch without one.</p>
          <div className="lp-actions">
            <Link href="/create-token" className="lp-btn lp-btn--primary">Create a token</Link>
            <Link href="/tools" className="lp-btn lp-btn--secondary">All tools</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
