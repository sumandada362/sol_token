import type { Metadata } from "next";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

const BASE = "https://forge.solana.tools";
const TITLE = "Burn Solana Tokens — Reduce Token Supply — FORGE";
const DESCRIPTION =
  "Permanently burn SPL or Token-2022 tokens from your wallet to reduce total supply. Free — only Solana gas. Irreversible and verifiable on-chain.";
const OG_URL = `${BASE}/og?title=${encodeURIComponent("Burn Tokens")}&sub=${encodeURIComponent(
  "Permanently reduce your Solana token's supply"
)}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "burn solana tokens",
    "reduce token supply solana",
    "spl token burn",
    "burn tokens from wallet",
    "solana token burner",
    "decrease circulating supply",
  ],
  alternates: { canonical: `${BASE}/burn` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/burn`,
    images: [{ url: OG_URL, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_URL],
  },
};

export default function BurnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: BASE },
          { name: "Tools", url: `${BASE}/tools` },
          { name: "Burn Tokens", url: `${BASE}/burn` },
        ]}
      />
      <JsonLdHowTo
        name="How to burn Solana tokens"
        description="Permanently remove tokens from circulation to reduce total supply."
        steps={[
          { name: "Open the tool", text: "Go to forge.solana.tools/burn and connect the wallet that holds the tokens." },
          { name: "Select your token", text: "Pick the token from your wallet list or paste its mint address." },
          { name: "Enter the amount", text: "Type the number of tokens to burn, or use Max to burn your full balance." },
          { name: "Sign the transaction", text: "Approve in your wallet. The tokens are destroyed and total supply drops permanently." },
        ]}
      />
      {children}
    </>
  );
}
