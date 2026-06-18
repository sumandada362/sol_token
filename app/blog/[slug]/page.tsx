import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import Footer from "@/components/Footer";
import { getArticle, getAllSlugs, getAllArticles } from "@/lib/content";
import { Fee } from "@/components/mdx/Fee";
import { Warning } from "@/components/mdx/Warning";
import { CTA } from "@/components/mdx/CTA";
import { Disclaimer } from "@/components/mdx/Disclaimer";
import { JsonLdFaqPage, JsonLdBreadcrumb, JsonLdArticle } from "@/components/JsonLd";
import { SITE_URL as BASE } from "@/lib/seo";

const mdxComponents = { Fee, Warning, CTA, Disclaimer };

export async function generateStaticParams() {
  return getAllSlugs("blog").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("blog", slug);
  if (!article) return {};
  const { frontmatter: fm } = article;
  const ogUrl = `${BASE}/og?title=${encodeURIComponent(fm.title)}&sub=${encodeURIComponent(fm.description)}`;
  return {
    title: `${fm.title} — Solana Token Blog`,
    description: fm.description,
    alternates: { canonical: `${BASE}/blog/${fm.slug}` },
    openGraph: {
      type: "article",
      title: fm.title,
      description: fm.description,
      url: `${BASE}/blog/${fm.slug}`,
      publishedTime: fm.date,
      modifiedTime: fm.updated ?? fm.date,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: fm.title,
      description: fm.description,
      images: [ogUrl],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle("blog", slug);
  if (!article) notFound();

  const { frontmatter: fm, content } = article;

  const allArticles = getAllArticles("blog");
  const related = allArticles
    .filter((a) => a.frontmatter.slug !== slug && a.frontmatter.tool === fm.tool)
    .slice(0, 3);
  const fallbackRelated = related.length
    ? related
    : allArticles.filter((a) => a.frontmatter.slug !== slug).slice(0, 3);

  const breadcrumbs = [
    { name: "Home", url: BASE },
    { name: "Blog", url: `${BASE}/blog` },
    { name: fm.title, url: `${BASE}/blog/${fm.slug}` },
  ];

  return (
    <div className="app-page">
      <JsonLdBreadcrumb items={breadcrumbs} />
      <JsonLdArticle
        title={fm.title}
        description={fm.description}
        slug={fm.slug}
        datePublished={fm.date}
        dateModified={fm.updated ?? fm.date}
      />
      {fm.faq && fm.faq.length > 0 && <JsonLdFaqPage faq={fm.faq} />}

      <div className="blog-article-layout">
        <nav className="blog-sidebar" data-reveal="fade">
          <Link href="/blog" className="blog-sidebar-back">
            ← All articles
          </Link>
          <div className="blog-sidebar-title">On this page</div>
          <a href="#article-top" className="docs-sidebar-link">
            Introduction
          </a>
          {fm.faq && fm.faq.length > 0 && (
            <a href="#faq" className="docs-sidebar-link">
              FAQ
            </a>
          )}
          {fallbackRelated.length > 0 && (
            <>
              <div className="docs-sidebar-divider" />
              <div className="blog-sidebar-title">Related</div>
              {fallbackRelated.map((r) => (
                <Link
                  key={r.frontmatter.slug}
                  href={`/blog/${r.frontmatter.slug}`}
                  className="docs-sidebar-link"
                >
                  {r.frontmatter.title}
                </Link>
              ))}
            </>
          )}
        </nav>

        <article className="blog-article-content" id="article-top" data-reveal>
          <div className="blog-article-meta">
            <span className="blog-card-cat">{fm.category === "guide" ? "Guide" : "Docs"}</span>
            <span>{fm.date}</span>
            {fm.readTime && (
              <>
                <span>·</span>
                <span>{fm.readTime}</span>
              </>
            )}
          </div>
          <h1 className="docs-article-h1">{fm.title}</h1>
          <p className="blog-article-lead">{fm.description}</p>

          <div className="mdx-body">
            <MDXRemote source={content} components={mdxComponents} />
          </div>

          {fm.faq && fm.faq.length > 0 && (
            <section id="faq" className="docs-article-section">
              <h2 className="docs-article-h2">Frequently asked questions</h2>
              <dl className="mdx-faq">
                {fm.faq.map(({ q, a }) => (
                  <div key={q} className="mdx-faq-item">
                    <dt className="mdx-faq-q">{q}</dt>
                    <dd className="mdx-faq-a">{a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <Disclaimer />

          <div className="blog-article-footer">
            <Link href="/blog" className="lp-btn lp-btn--secondary">
              ← Back to blog
            </Link>
            {fm.tool && <CTA tool={fm.tool} />}
          </div>
        </article>
      </div>
      <Footer />
    </div>
  );
}
