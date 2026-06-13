import type { Metadata } from "next";

/**
 * Single source of truth for SEO. SITE_URL is env-driven so canonical/OG URLs
 * follow the real deployment domain (set NEXT_PUBLIC_APP_URL); the fallback is
 * only used when the env var is absent.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.app").replace(/\/$/, "");
export const SITE_NAME = "Solana Token";
export const SITE_TAGLINE = "Create & Launch Solana Tokens";
export const DEFAULT_DESCRIPTION =
  "Create, manage, and launch Solana tokens (SPL & Token-2022) in minutes — no code. Mint, burn, multisend, update metadata, and revoke authorities from your own wallet.";

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
