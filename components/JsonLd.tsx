import type { FaqItem } from "@/lib/content";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.app";

/** Organization — used site-wide so Google links the brand, logo, and socials. */
export function JsonLdOrganization() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Solana Token",
    url: BASE,
    logo: `${BASE}/coin_gold.png`,
    description:
      "No-code toolkit to create, manage, and launch Solana tokens (SPL & Token-2022) from your own wallet.",
    sameAs: [] as string[], // add X/Telegram/GitHub URLs here once live
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** WebSite + Sitelinks SearchAction — enables a search box in Google results. */
export function JsonLdWebSite() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Solana Token",
    url: BASE,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${BASE}/token/{search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function JsonLdSoftwareApplication() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.app";
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Solana Token",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "No-code Solana token toolkit. Create SPL tokens, add liquidity, manage authorities, and analyze tokens — all from your browser wallet.",
    url: base,
    logo: `${base}/coin_gold.png`,
    image: `${base}/coin_gold.png`,
    offers: {
      "@type": "Offer",
      price: "0.1",
      priceCurrency: "SOL",
      description: "Token creation from 0.1 SOL all-in",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function JsonLdArticle({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  image,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
}) {
  const url = `${BASE}/blog/${slug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: image ?? `${BASE}/coin_gold.png`,
    datePublished,
    dateModified: dateModified ?? datePublished,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    author: { "@type": "Organization", name: "Solana Token", url: BASE },
    publisher: {
      "@type": "Organization",
      name: "Solana Token",
      logo: { "@type": "ImageObject", url: `${BASE}/coin_gold.png` },
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function JsonLdFaqPage({ faq }: { faq: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export type HowToStep = { name: string; text: string };

export function JsonLdHowTo({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: HowToStep[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function JsonLdBreadcrumb({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
