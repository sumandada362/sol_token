import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Docs — FORGE",
  description: "Learn how to create tokens, add liquidity, and manage your Solana tokens on FORGE.",
};

const categories = [
  {
    title: "Getting started",
    articles: [
      { slug: "create-a-token", title: "Create a token", desc: "Deploy an SPL or Token-2022 token in minutes." },
      { slug: "connect-wallet", title: "Connect your wallet", desc: "How to connect Phantom, Solflare, or Backpack." },
      { slug: "token-authorities", title: "Token authorities explained", desc: "Mint, freeze, and update authorities — what they mean." },
    ],
  },
  {
    title: "Liquidity",
    articles: [
      { slug: "add-liquidity", title: "Add liquidity", desc: "Create pools on Raydium, Orca, Meteora, and more." },
      { slug: "choosing-a-dex", title: "Choosing a DEX", desc: "Compare Raydium, Orca, Meteora, PumpSwap, Invariant, FluxBeam." },
    ],
  },
  {
    title: "Token management",
    articles: [
      { slug: "burn-tokens", title: "Burn tokens", desc: "Permanently reduce your token&apos;s circulating supply." },
      { slug: "security-checker", title: "Security checker", desc: "How to read authority badges and concentration risk." },
    ],
  },
  {
    title: "Reference",
    articles: [
      { slug: "faq", title: "FAQ", desc: "Frequently asked questions." },
      { slug: "pricing", title: "Pricing & fees", desc: "Full breakdown of platform and network costs." },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header page-header--center">
          <h1 className="page-title">Documentation</h1>
          <p className="page-sub">Everything you need to know about FORGE.</p>
          <input className="docs-search" type="search" placeholder="Search docs…" />
        </div>

        {categories.map((cat) => (
          <div key={cat.title} className="docs-category">
            <h2 className="docs-category-title">{cat.title}</h2>
            <div className="docs-articles">
              {cat.articles.map((a) => (
                <Link key={a.slug} href={`/docs/${a.slug}`} className="docs-article-card">
                  <div className="docs-article-title">{a.title}</div>
                  <p className="docs-article-desc" dangerouslySetInnerHTML={{ __html: a.desc }} />
                  <span className="docs-article-cta">Read →</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
