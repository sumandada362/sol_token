import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getAllArticles } from "@/lib/content";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

import { SITE_URL as BASE } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Blog — Solana Token",
  description:
    "Guides and tutorials for creating Solana tokens, adding liquidity, managing authorities, and using Solana Token tools.",
  alternates: { canonical: `${BASE}/blog` },
  openGraph: {
    title: "Blog — Solana Token",
    description: "Guides and tutorials for Solana token creators.",
    url: `${BASE}/blog`,
  },
};

const CATEGORIES = ["All", "Getting Started", "Liquidity", "Authority", "Tools", "Market", "Reference"];

export default function BlogPage() {
  const articles = getAllArticles("blog");
  const featured = articles.filter((a) => a.frontmatter.featured);
  const rest = articles.filter((a) => !a.frontmatter.featured);

  const breadcrumbs = [
    { name: "Home", url: BASE },
    { name: "Blog", url: `${BASE}/blog` },
  ];

  return (
    <div className="app-page">
      <JsonLdBreadcrumb items={breadcrumbs} />
      <div className="page-wrap">
        <div className="page-header page-header--center" data-reveal>
          <h1 className="page-title">Blog</h1>
          <p className="page-sub">Guides, tutorials, and reference for Solana token creators.</p>
        </div>

        <div className="tools-category-row" data-reveal="fade" style={{ "--delay": "80ms" } as React.CSSProperties}>
          {CATEGORIES.map((c) => (
            <span
              key={c}
              className={`tools-cat-chip${c === "All" ? " tools-cat-chip--active" : ""}`}
            >
              {c}
            </span>
          ))}
        </div>

        {featured.length > 0 && (
          <div className="blog-featured-row" data-stagger>
            {featured.map((a) => (
              <Link
                key={a.frontmatter.slug}
                href={`/blog/${a.frontmatter.slug}`}
                className="blog-card blog-card--featured"
              >
                <div className="blog-card-cat">{a.frontmatter.category === "guide" ? "Guide" : "Docs"}</div>
                <div className="blog-card-title">{a.frontmatter.title}</div>
                <div className="blog-card-desc">{a.frontmatter.description}</div>
                <div className="blog-card-meta">
                  <span>{a.frontmatter.date}</span>
                  {a.frontmatter.readTime && (
                    <>
                      <span>·</span>
                      <span>{a.frontmatter.readTime}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="blog-grid" data-stagger>
          {rest.map((a) => (
            <Link
              key={a.frontmatter.slug}
              href={`/blog/${a.frontmatter.slug}`}
              className="blog-card"
            >
              <div className="blog-card-cat">{a.frontmatter.category === "guide" ? "Guide" : "Docs"}</div>
              <div className="blog-card-title">{a.frontmatter.title}</div>
              <div className="blog-card-desc">{a.frontmatter.description}</div>
              <div className="blog-card-meta">
                <span>{a.frontmatter.date}</span>
                {a.frontmatter.readTime && (
                  <>
                    <span>·</span>
                    <span>{a.frontmatter.readTime}</span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
