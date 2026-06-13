import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getAllArticles } from "@/lib/content";
import { JsonLdBreadcrumb, JsonLdSoftwareApplication } from "@/components/JsonLd";

const BASE = "https://solanatoken.app";

export const metadata: Metadata = {
  title: "Docs — Solana Token",
  description:
    "Learn how to create tokens, add liquidity, manage authorities, and use every Solana Token tool on Solana.",
  alternates: { canonical: `${BASE}/docs` },
  openGraph: {
    title: "Docs — Solana Token",
    description: "Complete documentation for the Solana Token Solana token toolkit.",
    url: `${BASE}/docs`,
  },
};

const CATEGORY_ORDER = [
  "Getting Started",
  "Token Management",
  "Liquidity",
  "Tools",
  "Reference",
];

export default function DocsPage() {
  const articles = getAllArticles("docs");

  const byCategory: Record<string, typeof articles> = {};
  for (const a of articles) {
    const cat = a.frontmatter.category === "docs" ? (a.frontmatter.tool ? "Tools" : "Reference") : "Reference";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(a);
  }

  const breadcrumbs = [
    { name: "Home", url: BASE },
    { name: "Docs", url: `${BASE}/docs` },
  ];

  return (
    <div className="app-page">
      <JsonLdBreadcrumb items={breadcrumbs} />
      <JsonLdSoftwareApplication />
      <div className="page-wrap">
        <div className="page-header page-header--center" data-reveal>
          <h1 className="page-title">Documentation</h1>
          <p className="page-sub">Everything you need to know about Solana Token.</p>
        </div>

        <div className="docs-grid" data-stagger>
          {articles.map((a) => (
            <Link key={a.frontmatter.slug} href={`/docs/${a.frontmatter.slug}`} className="docs-article-card">
              <div className="docs-article-title">{a.frontmatter.title}</div>
              <p className="docs-article-desc">{a.frontmatter.description}</p>
              <span className="docs-article-cta">Read →</span>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
