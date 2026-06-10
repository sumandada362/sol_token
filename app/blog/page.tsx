import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog — FORGE",
  description: "Guides and tutorials for creating Solana tokens, adding liquidity, managing authorities, and using FORGE tools.",
};

const articles = [
  {
    slug: "how-to-create-solana-token",
    title: "How to Create a Solana Token in 5 Minutes",
    desc: "A step-by-step guide to deploying your own SPL token on Solana mainnet using FORGE — no coding required.",
    category: "Getting Started",
    date: "2026-05-20",
    readTime: "5 min read",
    featured: true,
  },
  {
    slug: "how-to-add-liquidity-raydium",
    title: "How to Add Liquidity on Raydium with Your Token",
    desc: "Everything you need to know about creating a Raydium pool for your new SPL token and setting initial liquidity.",
    category: "Liquidity",
    date: "2026-05-22",
    readTime: "7 min read",
    featured: true,
  },
  {
    slug: "how-to-bulk-send-solana-tokens",
    title: "How to Bulk Send Solana Tokens to Multiple Wallets",
    desc: "Distribute tokens to your community, team, or airdrop list efficiently using FORGE Multisender.",
    category: "Tools",
    date: "2026-05-25",
    readTime: "4 min read",
    featured: false,
  },
  {
    slug: "how-to-update-token-metadata",
    title: "How to Update Token Metadata on Solana",
    desc: "Edit your token's name, symbol, logo, and social links on-chain using the Metaplex metadata program.",
    category: "Tools",
    date: "2026-05-28",
    readTime: "4 min read",
    featured: false,
  },
  {
    slug: "how-to-revoke-mint-authority",
    title: "Why and How to Revoke Mint Authority",
    desc: "Revoking mint authority signals trust to buyers. Learn what it means, how to do it safely, and when to do it.",
    category: "Authority",
    date: "2026-06-01",
    readTime: "5 min read",
    featured: false,
  },
  {
    slug: "how-to-create-openbook-market",
    title: "How to Create an OpenBook Market for Your Token",
    desc: "Create an order-book DEX market for your token — required for some Raydium pool types.",
    category: "Market",
    date: "2026-06-03",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "sol-to-lamports-converter-guide",
    title: "SOL to Lamports: Complete Conversion Guide",
    desc: "Understand SOL units, lamports, and how on-chain arithmetic works for SPL token decimals.",
    category: "Reference",
    date: "2026-06-05",
    readTime: "3 min read",
    featured: false,
  },
  {
    slug: "how-to-mint-more-solana-tokens",
    title: "How to Mint Additional Tokens After Launch",
    desc: "If you retained mint authority, you can increase supply at any time. Here's how to do it safely.",
    category: "Tools",
    date: "2026-06-07",
    readTime: "4 min read",
    featured: false,
  },
];

const categories = ["All", "Getting Started", "Liquidity", "Tools", "Authority", "Market", "Reference"];

export default function BlogPage() {
  const featured = articles.filter((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header page-header--center">
          <h1 className="page-title">Blog</h1>
          <p className="page-sub">Guides, tutorials, and reference for Solana token creators.</p>
        </div>

        <div className="tools-category-row">
          {categories.map((c) => (
            <span key={c} className={`tools-cat-chip${c === "All" ? " tools-cat-chip--active" : ""}`}>{c}</span>
          ))}
        </div>

        {/* Featured */}
        <div className="blog-featured-row">
          {featured.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="blog-card blog-card--featured">
              <div className="blog-card-cat">{a.category}</div>
              <div className="blog-card-title">{a.title}</div>
              <div className="blog-card-desc">{a.desc}</div>
              <div className="blog-card-meta">
                <span>{a.date}</span>
                <span>·</span>
                <span>{a.readTime}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* All articles */}
        <div className="blog-grid">
          {rest.map((a) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="blog-card">
              <div className="blog-card-cat">{a.category}</div>
              <div className="blog-card-title">{a.title}</div>
              <div className="blog-card-desc">{a.desc}</div>
              <div className="blog-card-meta">
                <span>{a.date}</span>
                <span>·</span>
                <span>{a.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
