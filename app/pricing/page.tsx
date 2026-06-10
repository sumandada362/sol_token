import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pricing — FORGE",
  description: "Simple, transparent pricing for creating tokens, adding liquidity, and analytics on Solana.",
};

export default function PricingPage() {
  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header page-header--center">
          <h1 className="page-title">Simple, transparent pricing</h1>
          <p className="page-sub">No hidden fees. No per-authority surcharges. What you see is what you pay.</p>
        </div>

        {/* Plan cards */}
        <div className="pricing-cards">
          <PricingCard
            title="Create Token"
            price="0.1 SOL"
            href="/create"
            cta="Create a token"
            features={[
              "Deploy SPL or Token-2022",
              "Custom name, symbol, supply",
              "Logo & metadata upload",
              "Mint/freeze/update authority controls",
              "Vanity address (optional)",
              "Multi-wallet distribution",
            ]}
          />
          <PricingCard
            title="Add Liquidity"
            price="0.1 SOL / pool"
            href="/pool"
            cta="Add liquidity"
            featured
            features={[
              "Raydium, Orca, Meteora",
              "PumpSwap, Invariant, FluxBeam",
              "Split across multiple DEXs",
              "Live setup cost shown upfront",
              "Pre-flight balance checks",
              "Success links to your token page",
            ]}
          />
          <PricingCard
            title="Analytics"
            price="0.5 SOL / year"
            href="/dashboard"
            cta="View analytics"
            features={[
              "Price & volume charts",
              "Liquidity / TVL tracking",
              "Holder growth over time",
              "Buy/sell ratio",
              "Transaction history table",
              "Configurable alerts",
            ]}
          />
        </div>

        {/* What you don't pay */}
        <div className="pricing-note lp-card">
          <h2 className="pricing-note-title">What you don&apos;t pay</h2>
          <ul className="pricing-note-list">
            <li>No per-authority surcharge (revoke mint, freeze, or update for free)</li>
            <li>No ongoing platform fee per transaction</li>
            <li>No wallet custody or escrow fees</li>
          </ul>
          <p className="pricing-note-sub">
            Network rent and DEX setup costs are pass-throughs — you pay the Solana network and the DEX directly.
            These are always shown in the cost summary before you sign.
          </p>
        </div>

        {/* FAQ */}
        <div className="pricing-faq">
          <h2 className="lp-heading" style={{ marginBottom: "2rem" }}>Frequently asked</h2>
          <details className="lp-faq-item">
            <summary>Are fees refundable? <span className="lp-faq-icon" aria-hidden>+</span></summary>
            <div className="lp-faq-answer">Platform fees are non-refundable once a transaction is confirmed on-chain. Network and DEX costs follow their respective protocols&apos; policies.</div>
          </details>
          <details className="lp-faq-item">
            <summary>What are network/rent costs? <span className="lp-faq-icon" aria-hidden>+</span></summary>
            <div className="lp-faq-answer">Solana charges a small rent deposit to store your token&apos;s on-chain account (~0.002 SOL). This is separate from our platform fee and is shown in the cost breakdown before you sign.</div>
          </details>
          <details className="lp-faq-item">
            <summary>Can fees change? <span className="lp-faq-icon" aria-hidden>+</span></summary>
            <div className="lp-faq-answer">We may update pricing with notice. Published fees apply at the time of signing. Changes will be announced before they take effect.</div>
          </details>
          <details className="lp-faq-item">
            <summary>Do I pay per authority I revoke? <span className="lp-faq-icon" aria-hidden>+</span></summary>
            <div className="lp-faq-answer">No. You can revoke any combination of mint, freeze, and update authorities at no extra cost beyond the base creation fee.</div>
          </details>
        </div>

        <div className="lp-actions lp-actions--center" style={{ marginTop: "3rem" }}>
          <Link href="/docs" className="lp-btn lp-btn--secondary">Read the docs</Link>
          <Link href="/create" className="lp-btn lp-btn--primary">Create a token</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function PricingCard({ title, price, href, cta, features, featured }: {
  title: string; price: string; href: string; cta: string; features: string[]; featured?: boolean;
}) {
  return (
    <div className={`pricing-card ${featured ? "pricing-card--featured" : ""}`}>
      {featured && <div className="pricing-card-badge">Most popular</div>}
      <div className="pricing-card-title">{title}</div>
      <div className="pricing-card-price">{price}</div>
      <ul className="pricing-card-features">
        {features.map((f) => (
          <li key={f}><span className="pricing-check">✓</span>{f}</li>
        ))}
      </ul>
      <Link href={href} className={`lp-btn ${featured ? "lp-btn--primary" : "lp-btn--secondary"}`}>{cta}</Link>
    </div>
  );
}
