import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

const articles: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  "create-a-token": {
    title: "Create a token",
    sections: [
      { heading: "Overview", body: "FORGE lets you deploy an SPL or Token-2022 token on Solana in under 2 minutes with no code required. The creation wizard guides you through connecting your wallet, configuring basics, adding branding, setting authority controls, and signing a single transaction." },
      { heading: "Step 1 — Connect", body: "Click 'Connect Wallet' and choose Phantom, Solflare, or Backpack. Make sure you're on mainnet and have enough SOL for fees (0.1 SOL base fee + ~0.002 SOL network rent, plus add-ons if selected)." },
      { heading: "Step 2 — Basics", body: "Enter your token name, symbol (permanent — cannot change after creation), total supply, and decimals. 9 decimals is the standard for most SPL tokens." },
      { heading: "Step 3 — Branding", body: "Upload a logo (1:1 PNG or SVG recommended), write a description, and add optional social links (website, X, Telegram)." },
      { heading: "Step 4 — Advanced", body: "Choose between SPL and Token-2022 standards. Optionally revoke mint authority (+0.05 SOL), revoke freeze authority (+0.05 SOL), make immutable (free), or add custom creator info (+0.1 SOL). The cost summary updates live. You can also enable vanity address generation (slower)." },
      { heading: "Step 5 — Review & sign", body: "Review your full configuration and cost breakdown. Click 'Create token' to initiate the transaction, then approve it in your wallet." },
      { heading: "After creation", body: "Your token will be deployed and you'll see the mint address. From there you can add liquidity, view the token page, or share the link." },
    ],
  },
  "add-liquidity": {
    title: "Add liquidity",
    sections: [
      { heading: "Overview", body: "Adding liquidity creates a trading pool for your token on one or more DEXs. Without liquidity, your token can't be traded on-market." },
      { heading: "Choosing a DEX", body: "FORGE supports Raydium, Orca, Meteora, PumpSwap, Invariant, and FluxBeam. You can select multiple DEXs and fund them in a single flow." },
      { heading: "Setting amounts", body: "For each DEX, enter the token amount and SOL amount you want to provide as initial liquidity. Use the 'Max' button to use your full balance." },
      { heading: "Fees", body: "FORGE charges 0.1 SOL per pool (per DEX). Each DEX also charges a one-time setup cost of 0.4–0.6 SOL paid directly to the DEX protocol — this varies by DEX and is shown upfront in the cost summary before you sign." },
    ],
  },
  "faq": {
    title: "Frequently asked questions",
    sections: [
      { heading: "Is FORGE non-custodial?", body: "Yes. We never hold your private keys or SOL. Every transaction is signed by your own wallet. We cannot access your funds." },
      { heading: "Can I get a refund?", body: "Platform fees are non-refundable once confirmed on-chain. On-chain actions are permanent by nature." },
      { heading: "What wallets are supported?", body: "Phantom, Solflare, and Backpack. We'll add more wallets based on demand." },
      { heading: "Is the symbol really permanent?", body: "Yes. The token symbol is stored in on-chain metadata. Once a token is created, the symbol cannot be changed." },
      { heading: "What does revoking authorities mean?", body: "Revoking mint authority means no one can ever mint more tokens. Revoking freeze means no wallet can ever be frozen. Revoking update means metadata can never change. These increase community trust." },
      { heading: "How much SOL do I need?", body: "0.1 SOL base for token creation + 0.05 SOL per authority revoked (mint/freeze) + 0.1 SOL for custom creator info (optional). Per liquidity pool: 0.1 SOL FORGE fee + 0.4–0.6 SOL DEX setup (paid to the DEX). Multisender: 0.01 SOL flat per transaction. Plus small Solana network rent (~0.002 SOL)." },
    ],
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = articles[slug];
  return {
    title: article ? `${article.title} — FORGE Docs` : "Docs — FORGE",
    description: article ? `Learn about ${article.title} on FORGE.` : "FORGE documentation.",
  };
}

export default async function DocArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];

  return (
    <div className="app-page">
      <div className="docs-article-layout">
        {/* Sidebar */}
        <nav className="docs-sidebar">
          <div className="docs-sidebar-title">Documentation</div>
          <Link href="/docs" className="docs-sidebar-link">← All docs</Link>
          <div className="docs-sidebar-divider" />
          {article?.sections.map((s) => (
            <a key={s.heading} href={`#${s.heading.toLowerCase().replace(/\s+/g, "-")}`} className="docs-sidebar-link">
              {s.heading}
            </a>
          ))}
        </nav>

        {/* Article */}
        <article className="docs-article-content">
          {article ? (
            <>
              <h1 className="docs-article-h1">{article.title}</h1>
              {article.sections.map((s) => (
                <section key={s.heading} id={s.heading.toLowerCase().replace(/\s+/g, "-")} className="docs-article-section">
                  <h2 className="docs-article-h2">{s.heading}</h2>
                  <p className="lp-body">{s.body}</p>
                </section>
              ))}
              <div className="docs-helpful">
                <span>Was this helpful?</span>
                <button className="docs-helpful-btn">Yes</button>
                <button className="docs-helpful-btn">No</button>
              </div>
              <div className="docs-related">
                <div className="docs-related-title">Related</div>
                <Link href="/docs/faq" className="lp-link">FAQ →</Link>
                <Link href="/create" className="lp-link">Create a token →</Link>
              </div>
            </>
          ) : (
            <div>
              <h1 className="docs-article-h1">Article not found</h1>
              <p className="lp-body">This article doesn&apos;t exist yet.</p>
              <Link href="/docs" className="lp-btn lp-btn--secondary" style={{ display: "inline-flex", marginTop: "1.5rem" }}>Back to docs</Link>
            </div>
          )}
        </article>
      </div>
      <Footer />
    </div>
  );
}
