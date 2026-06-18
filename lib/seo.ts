import type { Metadata } from "next";

/**
 * Single source of truth for SEO. SITE_URL is env-driven so canonical/OG URLs
 * follow the real deployment domain (set NEXT_PUBLIC_APP_URL, or the legacy
 * NEXT_PUBLIC_SITE_URL). The production domain is the default.
 *
 * Hardening: a localhost / non-https value is IGNORED. A sitemap, robots host,
 * canonical, or OG URL must never point at localhost — that silently breaks
 * indexing and social previews. So if the env var is empty, http, or a
 * localhost/127.0.0.1 origin, we fall back to the canonical production domain.
 */
export const PRODUCTION_SITE_URL = "https://solanatoken.dravyo.com";

function resolveSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "").trim();
  const usable =
    raw &&
    /^https:\/\//i.test(raw) &&
    !/^https:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:|\/|$)/i.test(raw);
  return (usable ? raw : PRODUCTION_SITE_URL).replace(/\/$/, "");
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "Solana Token";
export const SITE_TAGLINE = "Create & Launch Solana Tokens";
// App NAME stays "Solana Token"; descriptions/metadata use the
// "Dravyo Solana Token creator" brand line (per product copy).
export const DEFAULT_DESCRIPTION =
  "Dravyo Solana Token creator is the fastest and safest way to create and launch tokens on Solana — no coding, no complexity. Customize your token in a few clicks and it's ready to touch a million-dollar market cap.";

/** Absolute URL for a path. */
export function abs(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Dynamic OG image URL via the /og route. */
export function ogImage(title: string, sub?: string): string {
  const q = new URLSearchParams({ title });
  if (sub) q.set("sub", sub);
  return `${SITE_URL}/og?${q.toString()}`;
}

interface PageMetaInput {
  title: string; // the <title> (a "— Solana Token" suffix is added unless includeSuffix=false)
  description: string;
  path: string; // canonical path, e.g. "/create-token"
  keywords?: string[];
  ogTitle?: string; // short title baked into the OG image
  ogSub?: string;
  includeSuffix?: boolean;
}

/**
 * Build a complete, consistent Metadata object for a page: title, description,
 * keywords, canonical, Open Graph, and Twitter cards with a dynamic OG image.
 */
export function pageMeta({
  title,
  description,
  path,
  keywords,
  ogTitle,
  ogSub,
  includeSuffix = true,
}: PageMetaInput): Metadata {
  const fullTitle = includeSuffix ? `${title} | ${SITE_NAME}` : title;
  const url = abs(path);
  const img = ogImage(ogTitle ?? title, ogSub ?? description.slice(0, 110));
  return {
    title: fullTitle,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [img],
    },
  };
}
