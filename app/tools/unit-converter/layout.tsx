import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Solana Token Unit Converter — Decimals to Raw Amount",
  description:
    "Convert token amounts to raw on-chain units for any decimals (0, 6, 9). Free, client-side — get the exact u64 amount for SPL transfers, mints, and burns with no precision loss.",
  path: "/tools/unit-converter",
  ogTitle: "Token Unit Converter",
  ogSub: "Token amount ↔ raw u64 units",
  keywords: [
    "solana token unit converter",
    "token decimals calculator",
    "raw token amount solana",
    "spl token decimals converter",
    "u64 token amount",
  ],
});

export default function UnitConverterLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Unit Converter", url: `${SITE_URL}/tools/unit-converter` },
        ]}
      />
      {children}
    </>
  );
}
