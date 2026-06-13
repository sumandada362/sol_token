import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/content";

const BASE = "https://solanatoken.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

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
    "/tools/market/create",
    "/tools/unit-converter",
    "/tools/sol-converter",
    "/legal/terms",
    "/legal/privacy",
    "/legal/risk",
  ];

  const blogSlugs = getAllSlugs("blog");
  const docSlugs = getAllSlugs("docs");

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority:
        route === "/"
          ? 1.0
          : route.startsWith("/tools") || route.startsWith("/blog")
          ? 0.9
          : 0.8,
    })),
    ...blogSlugs.map((slug) => ({
      url: `${BASE}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...docSlugs.map((slug) => ({
      url: `${BASE}/docs/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
