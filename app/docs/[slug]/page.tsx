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
import { JsonLdFaqPage, JsonLdBreadcrumb } from "@/components/JsonLd";

const BASE = "https://forge.solana.tools";

const mdxComponents = { Fee, Warning, CTA, Disclaimer };

export async function generateStaticParams() {
  return getAllSlugs("docs").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle("docs", slug);
  if (!article) return {};
  const { frontmatter: fm } = article;
  const ogUrl = `${BASE}/og?title=${encodeURIComponent(fm.title)}&sub=${encodeURIComponent(fm.description)}`;
  return {
    title: `${fm.title} — FORGE Docs`,
    description: fm.description,
    alternates: { canonical: `${BASE}/docs/${fm.slug}` },
    openGraph: {
      title: fm.title,
      description: fm.description,
      url: `${BASE}/docs/${fm.slug}`,
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

export default async function DocArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle("docs", slug);
  if (!article) notFound();

  const { frontmatter: fm, content } = article;

  const allDocs = getAllArticles("docs");
  const related = allDocs
    .filter((a) => a.frontmatter.slug !== slug && a.frontmatter.tool === fm.tool)
    .slice(0, 3);

  const breadcrumbs = [
    { name: "Home", url: BASE },
    { name: "Docs", url: `${BASE}/docs` },
    { name: fm.title, url: `${BASE}/docs/${fm.slug}` },
  ];

  return (
    <div className="app-page">
      <JsonLdBreadcrumb items={breadcrumbs} />
      {fm.faq && fm.faq.length > 0 && <JsonLdFaqPage faq={fm.faq} />}

      <div className="docs-article-layout">
        <nav className="docs-sidebar">
          <div className="docs-sidebar-title">Documentation</div>
          <Link href="/docs" className="docs-sidebar-link">
            ← All docs
          </Link>
          <div className="docs-sidebar-divider" />
          {related.length > 0 && (
            <>
              <div className="docs-sidebar-title" style={{ marginTop: "1rem" }}>
                Related
              </div>
              {related.map((r) => (
                <Link
                  key={r.frontmatter.slug}
                  href={`/docs/${r.frontmatter.slug}`}
                  className="docs-sidebar-link"
                >
                  {r.frontmatter.title}
                </Link>
              ))}
              <div className="docs-sidebar-divider" />
            </>
          )}
        </nav>

        <article className="docs-article-content">
          <h1 className="docs-article-h1">{fm.title}</h1>
          <p className="blog-article-lead">{fm.description}</p>

          <div className="mdx-body">
            <MDXRemote source={content} components={mdxComponents} />
          </div>

          {fm.faq && fm.faq.length > 0 && (
            <section id="faq" className="docs-article-section">
              <h2 className="docs-article-h2">FAQ</h2>
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

          {fm.tool && (
            <div className="docs-helpful">
              <span>Ready to use this tool?</span>
              <CTA tool={fm.tool} />
            </div>
          )}
        </article>
      </div>
      <Footer />
    </div>
  );
}
