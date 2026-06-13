import type { FaqItem } from "@/lib/content";

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
