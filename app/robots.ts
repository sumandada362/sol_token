import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Allow the whole site EXCEPT internal/non-content routes. The tool and
        // create/burn/pool pages are primary landing pages and MUST be crawlable.
        allow: "/",
        disallow: [
          "/api/", // server endpoints — never index
          "/og", // dynamic OG image generator
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
