import type { MetadataRoute } from "next";
import { getAllArticles, getAllSlugs } from "@/lib/content";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // High-intent conversion pages get the top priority.
  const primary = ["/create-token", "/tools/multisender", "/tools/mint-tokens", "/burn"];

  const staticRoutes = [
    "/",
    "/create-token",
    "/pool",
    "/pool/add",
    "/pool/remove",
    "/burn",
    "/docs",
    "/blog",
    "/tools",
    "/tools/multisender",
    "/tools/multisender/sol",
    "/tools/multisender/usdc",
    "/tools/multisender/usdt",
    "/tools/multisender/bonk",
    "/tools/mint-tokens",
    "/tools/update-metadata",
    "/tools/revoke-mint",
    "/tools/revoke-freeze",
    "/tools/revoke-update",
    "/tools/make-immutable",
    "/tools/freeze-account",
    "/tools/unfreeze-account",
    "/tools/burn-lp",
    "/tools/market/create",
    "/tools/unit-converter",
    "/tools/sol-converter",
    "/legal/terms",
    "/legal/privacy",
    "/legal/risk",
  ];

  const blogArticles = getAllArticles("blog");
  const docSlugs = getAllSlugs("docs");

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1.0 : primary.includes(route) ? 0.95 : route.startsWith("/tools") ? 0.9 : 0.7,
    })),
    ...blogArticles.map((a) => ({
      url: `${SITE_URL}/blog/${a.frontmatter.slug}`,
      lastModified: a.frontmatter.updated ?? a.frontmatter.date ?? now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...docSlugs.map((slug) => ({
      url: `${SITE_URL}/docs/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
