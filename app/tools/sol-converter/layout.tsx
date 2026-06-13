import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "SOL to Lamports Converter — Free Solana Calculator",
  description:
    "Instantly convert between SOL and lamports (1 SOL = 1,000,000,000 lamports). Free, client-side, no wallet needed — exact math for fees, rent, and transfers.",
  path: "/tools/sol-converter",
  ogTitle: "SOL ↔ Lamports Converter",
  ogSub: "1 SOL = 1,000,000,000 lamports",
  keywords: [
    "sol to lamports",
    "lamports to sol",
    "solana converter",
    "sol lamports calculator",
    "convert sol to lamports",
  ],
});

export default function SolConverterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "SOL Converter", url: `${SITE_URL}/tools/sol-converter` },
        ]}
      />
      {children}
    </>
  );
}
