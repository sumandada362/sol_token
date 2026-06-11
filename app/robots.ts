import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog/", "/docs/", "/legal/"],
        disallow: [
          "/tools/",
          "/create-token/",
          "/burn/",
          "/pool/",
          "/token/",
          "/api/",
          "/og/",
          "/dashboard/",
          "/account/",
        ],
      },
    ],
    sitemap: "https://forge.solana.tools/sitemap.xml",
  };
}
