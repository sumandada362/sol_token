import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";

type Article = {
  slug: string;
  title: string;
  desc: string;
  category: string;
  date: string;
  readTime: string;
  content: { heading: string; body: string }[];
  related: string[];
};

const articles: Article[] = [
  {
    slug: "how-to-create-solana-token",
    title: "How to Create a Solana Token in 5 Minutes",
    desc: "A step-by-step guide to deploying your own SPL token on Solana mainnet using FORGE — no coding required.",
    category: "Getting Started",
    date: "2026-05-20",
    readTime: "5 min read",
    content: [
      {
        heading: "What you need",
        body: "A Solana wallet (Phantom, Backpack, or Solflare) with at least 0.15 SOL to cover the platform fee (~0.1 SOL) and Solana rent (~0.002 SOL).",
      },
      {
        heading: "Step 1 — Fill in token details",
        body: "Head to FORGE → Create. Choose SPL (standard) or Token-2022 (extensions). Enter your token name, symbol (ticker), total supply, and decimals. Most meme tokens use 9 decimals; stablecoins use 6.",
      },
      {
        heading: "Step 2 — Upload logo & metadata",
        body: "Upload a square image (PNG/SVG recommended). FORGE will pin it to IPFS or Arweave automatically and generate the metadata JSON URI for you.",
      },
      {
        heading: "Step 3 — Set authority options",
        body: "Decide whether to keep or revoke mint authority and freeze authority at creation. You can always revoke later using the FORGE Tools, but doing it at launch builds instant trust.",
      },
      {
        heading: "Step 4 — Review and sign",
        body: "Review the cost summary: platform fee (0.1 SOL) + network rent. Approve the transaction in your wallet. FORGE sends you directly to your token page on success.",
      },
      {
        heading: "What's next?",
        body: "Add liquidity on a DEX so your token can be traded. Check out the liquidity guide or head straight to FORGE → Pool.",
      },
    ],
    related: ["how-to-add-liquidity-raydium", "how-to-revoke-mint-authority"],
  },
  {
    slug: "how-to-add-liquidity-raydium",
    title: "How to Add Liquidity on Raydium with Your Token",
    desc: "Everything you need to know about creating a Raydium pool for your new SPL token.",
    category: "Liquidity",
    date: "2026-05-22",
    readTime: "7 min read",
    content: [
      {
        heading: "Why add liquidity?",
        body: "Without liquidity, your token cannot be traded on any DEX. Adding initial liquidity establishes the starting price and lets others buy and sell.",
      },
      {
        heading: "Raydium CPMM vs Legacy AMM",
        body: "Raydium CPMM is the modern pool type — lower fees and no OpenBook market required. Legacy AMM requires an OpenBook market first. FORGE defaults to CPMM.",
      },
      {
        heading: "Step 1 — Go to FORGE → Pool",
        body: "Select your token from the dropdown or paste the mint address. Select Raydium from the DEX grid.",
      },
      {
        heading: "Step 2 — Set amounts",
        body: "Enter how many tokens and how much SOL to deposit. This ratio sets the initial price. E.g. 1,000,000 tokens + 10 SOL = 0.00001 SOL per token.",
      },
      {
        heading: "Step 3 — Review cost and sign",
        body: "Raydium CPMM pool creation costs ~0.30 SOL network pass-through + 0.1 SOL platform fee. Confirm in your wallet.",
      },
    ],
    related: ["how-to-create-solana-token", "how-to-create-openbook-market"],
  },
  {
    slug: "how-to-bulk-send-solana-tokens",
    title: "How to Bulk Send Solana Tokens to Multiple Wallets",
    desc: "Distribute tokens efficiently using FORGE Multisender.",
    category: "Tools",
    date: "2026-05-25",
    readTime: "4 min read",
    content: [
      {
        heading: "When to use Multisender",
        body: "Airdrops, team allocations, community rewards, marketing distributions — any time you need to send tokens to more than a handful of wallets.",
      },
      {
        heading: "Format your recipients list",
        body: "Prepare a CSV or plain text file. Each line: wallet_address, amount. Example: 7xKqAbcDef...123, 1000",
      },
      {
        heading: "Supported tokens",
        body: "SOL, USDC, USDT, BONK, and any SPL token by mint address. Use the /tools/multisender/sol shortcut for SOL airdrops.",
      },
      {
        heading: "Fees",
        body: "0.05 SOL platform fee + ~0.002 SOL rent per new token account. Rent is a Solana network cost, not a FORGE fee.",
      },
    ],
    related: ["how-to-create-solana-token", "sol-to-lamports-converter-guide"],
  },
  {
    slug: "how-to-update-token-metadata",
    title: "How to Update Token Metadata on Solana",
    desc: "Edit your token's name, symbol, logo, and social links on-chain.",
    category: "Tools",
    date: "2026-05-28",
    readTime: "4 min read",
    content: [
      {
        heading: "What can you update?",
        body: "Name, symbol, metadata URI (which points to logo, description, socials), and off-chain fields like website, X/Twitter, and Telegram.",
      },
      {
        heading: "Requirements",
        body: "You must hold the update authority for the token. If you already made it immutable, metadata cannot be changed.",
      },
      {
        heading: "On-chain vs off-chain",
        body: "Name and symbol are on-chain (gas required). Logo and socials are stored in a JSON file pointed to by the URI — updating that file changes the appearance everywhere without another transaction.",
      },
      {
        heading: "Fee",
        body: "0.05 SOL platform fee + network gas. If only changing the URI JSON (off-chain), no transaction is needed.",
      },
    ],
    related: ["how-to-revoke-mint-authority"],
  },
  {
    slug: "how-to-revoke-mint-authority",
    title: "Why and How to Revoke Mint Authority",
    desc: "Revoking mint authority signals trust to buyers. Learn what it means and when to do it.",
    category: "Authority",
    date: "2026-06-01",
    readTime: "5 min read",
    content: [
      {
        heading: "What is mint authority?",
        body: "Mint authority is the ability to create new tokens. If a wallet holds mint authority, they can inflate supply at any time — which is a significant risk signal for buyers.",
      },
      {
        heading: "Why revoke it?",
        body: "Revoking mint authority permanently caps the token supply. This is a strong positive signal: no one can ever dilute holders. Many DEX launchpad tools check for this.",
      },
      {
        heading: "When to revoke",
        body: "After your initial distribution is done. You cannot undo a revocation, so make sure the supply is finalized. If you plan to mint in phases, keep authority until you're certain.",
      },
      {
        heading: "How to do it",
        body: "Go to FORGE → Tools → Revoke Mint. Select your token, check the confirmation box, and sign. The action is free (network gas only).",
      },
    ],
    related: ["how-to-create-solana-token", "how-to-update-token-metadata"],
  },
  {
    slug: "how-to-create-openbook-market",
    title: "How to Create an OpenBook Market for Your Token",
    desc: "Create an order-book DEX market — required for some Raydium pool types.",
    category: "Market",
    date: "2026-06-03",
    readTime: "6 min read",
    content: [
      {
        heading: "What is an OpenBook market?",
        body: "OpenBook is a decentralized order-book DEX on Solana. Creating a market defines the trading pair (your token vs SOL/USDC) and enables limit orders.",
      },
      {
        heading: "Do you need one?",
        body: "Raydium CPMM does not require it. Raydium Legacy AMM does. If you're creating a CPMM pool, skip this step.",
      },
      {
        heading: "Cost",
        body: "~3.5 SOL as a pass-through rent deposit to the OpenBook program + 0.05 SOL FORGE fee. The 3.5 SOL is not a fee — it's on-chain account storage that can theoretically be reclaimed if the market is closed.",
      },
      {
        heading: "Parameters",
        body: "Set min order size (minimum tradeable amount) and tick size (minimum price increment). Typical values: min order 1 token, tick 0.0001 SOL.",
      },
    ],
    related: ["how-to-add-liquidity-raydium"],
  },
  {
    slug: "sol-to-lamports-converter-guide",
    title: "SOL to Lamports: Complete Conversion Guide",
    desc: "Understand SOL units, lamports, and SPL token decimals.",
    category: "Reference",
    date: "2026-06-05",
    readTime: "3 min read",
    content: [
      {
        heading: "What is a lamport?",
        body: "A lamport is the smallest unit of SOL, named after Leslie Lamport. 1 SOL = 1,000,000,000 lamports (10⁹). All on-chain amounts are stored as integers in lamports.",
      },
      {
        heading: "Token decimals",
        body: "SPL tokens use a similar scheme. A token with 9 decimals stores amounts as raw integers × 10⁹. 1 token = 1,000,000,000 raw units. USDC uses 6 decimals, so 1 USDC = 1,000,000 raw units.",
      },
      {
        heading: "Why does this matter?",
        body: "When building integrations or checking on-chain data, all amounts appear as raw integers. Divide by 10^decimals to get the human-readable amount.",
      },
      {
        heading: "Quick reference",
        body: "Use the FORGE Unit Converter tool to convert between SOL ↔ lamports and token amounts ↔ raw units instantly.",
      },
    ],
    related: ["how-to-create-solana-token"],
  },
  {
    slug: "how-to-mint-more-solana-tokens",
    title: "How to Mint Additional Tokens After Launch",
    desc: "If you retained mint authority, you can increase supply at any time.",
    category: "Tools",
    date: "2026-06-07",
    readTime: "4 min read",
    content: [
      {
        heading: "Requirements",
        body: "You must have retained mint authority when creating the token. If you already revoked it, additional minting is impossible — the supply is permanently capped.",
      },
      {
        heading: "When to mint more",
        body: "Staking rewards, vesting unlocks, partnership allocations, or ecosystem fund top-ups. Think carefully: each mint increases supply, which can dilute existing holders.",
      },
      {
        heading: "How to mint",
        body: "Go to FORGE → Tools → Mint Tokens. Select your token, enter the amount to mint, and specify the destination wallet (defaults to yours). Review the cost and sign.",
      },
      {
        heading: "Fee",
        body: "0.05 SOL platform fee + network gas (~0.001 SOL).",
      },
    ],
    related: ["how-to-revoke-mint-authority", "how-to-create-solana-token"],
  },
];

const articleMap = Object.fromEntries(articles.map((a) => [a.slug, a]));

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = articleMap[slug];
  if (!a) return {};
  return { title: `${a.title} — FORGE Blog`, description: a.desc };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articleMap[slug];
  if (!article) notFound();

  const relatedArticles = article.related.map((s) => articleMap[s]).filter(Boolean);

  return (
    <div className="app-page">
      <div className="blog-article-layout">
        <nav className="blog-sidebar">
          <Link href="/blog" className="blog-sidebar-back">← All articles</Link>
          <div className="blog-sidebar-title">Contents</div>
          {article.content.map((s) => (
            <a key={s.heading} href={`#${s.heading.toLowerCase().replace(/\s+/g, "-")}`} className="docs-sidebar-link">
              {s.heading}
            </a>
          ))}
          {relatedArticles.length > 0 && (
            <>
              <div className="docs-sidebar-divider" />
              <div className="blog-sidebar-title">Related</div>
              {relatedArticles.map((r) => (
                <Link key={r.slug} href={`/blog/${r.slug}`} className="docs-sidebar-link">{r.title}</Link>
              ))}
            </>
          )}
        </nav>

        <article className="blog-article-content">
          <div className="blog-article-meta">
            <span className="blog-card-cat">{article.category}</span>
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
          <h1 className="docs-article-h1">{article.title}</h1>
          <p className="blog-article-lead">{article.desc}</p>

          {article.content.map((section) => (
            <section key={section.heading} id={section.heading.toLowerCase().replace(/\s+/g, "-")}>
              <h2 className="docs-article-h2">{section.heading}</h2>
              <p className="lp-body">{section.body}</p>
            </section>
          ))}

          <div className="blog-article-footer">
            <Link href="/blog" className="lp-btn lp-btn--secondary">← Back to blog</Link>
            <Link href="/create" className="lp-btn lp-btn--primary">Create a token</Link>
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}
