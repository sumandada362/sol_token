import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Mint More Solana Tokens — Increase Token Supply",
  description:
    "Mint additional supply of your SPL or Token-2022 token to any wallet — possible only if you kept mint authority. The recipient's token account is created automatically. 0.05 SOL.",
  path: "/tools/mint-tokens",
  ogTitle: "Mint More Tokens",
  ogSub: "Increase your Solana token's supply",
  keywords: [
    "mint solana tokens",
    "increase token supply solana",
    "mint more spl tokens",
    "solana mint authority",
    "add token supply solana",
    "mint additional tokens",
  ],
});

export default function MintTokensLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Mint Tokens", url: `${SITE_URL}/tools/mint-tokens` },
        ]}
      />
      <JsonLdHowTo
        name="How to mint more Solana tokens"
        description="Increase the supply of a token you control by minting to any wallet."
        steps={[
          { name: "Select your token", text: "Connect the mint-authority wallet and choose the token or paste its mint address." },
          { name: "Set amount and destination", text: "Enter how many tokens to mint and the destination wallet." },
          { name: "Sign", text: "Approve the transaction. New supply is minted and the destination account is created if needed." },
        ]}
      />
      {children}
    </>
  );
}
