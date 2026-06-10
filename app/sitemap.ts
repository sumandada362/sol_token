import type { MetadataRoute } from "next";

const BASE = "https://forge.solana.tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes = [
    "/",
    "/create",
    "/explore",
    "/pool",
    "/pool/add",
    "/pool/remove",
    "/burn",
    "/dashboard",
    "/account",
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
    "/tools/make-immutable",
    "/tools/market/create",
    "/tools/unit-converter",
    "/tools/sol-converter",
    "/legal/terms",
    "/legal/privacy",
    "/legal/risk",
  ];

  const blogSlugs = [
    "how-to-create-solana-token",
    "how-to-add-liquidity-raydium",
    "how-to-bulk-send-solana-tokens",
    "how-to-update-token-metadata",
    "how-to-revoke-mint-authority",
    "how-to-create-openbook-market",
    "sol-to-lamports-converter-guide",
    "how-to-mint-more-solana-tokens",
  ];

  const docSlugs = [
    "faq",
    "create",
    "pool",
    "burn",
    "multisender",
    "mint-tokens",
    "update-metadata",
    "revoke-mint",
    "revoke-freeze",
    "openbook-market",
    "analytics",
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${BASE}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "/" ? 1.0 : route.startsWith("/tools") || route.startsWith("/blog") ? 0.9 : 0.8,
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
