import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Solana Multisender — Bulk Send & Airdrop SPL Tokens",
  description:
    "Airdrop SPL or Token-2022 tokens to hundreds of wallets in batched transactions. Upload a CSV, preview totals, and send — recipient token accounts are created automatically. 0.02 SOL per batch.",
  path: "/tools/multisender",
  ogTitle: "Solana Multisender",
  ogSub: "Bulk send tokens to thousands of wallets",
  keywords: [
    "solana multisender",
    "bulk send solana tokens",
    "solana airdrop tool",
    "send spl tokens to multiple wallets",
    "batch token transfer solana",
    "csv token airdrop solana",
    "mass send solana tokens",
  ],
});

export default function MultisenderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Multisender", url: `${SITE_URL}/tools/multisender` },
        ]}
      />
      <JsonLdHowTo
        name="How to bulk send Solana tokens"
        description="Airdrop SPL tokens to many wallets at once from a CSV."
        steps={[
          { name: "Open the multisender", text: "Connect your wallet and select the token you want to distribute." },
          { name: "Upload recipients", text: "Paste or upload a CSV of wallet addresses and amounts. The preview shows totals and flags invalid rows." },
          { name: "Review the quote", text: "Check the batch count, ATA-creation rent, and total cost before signing." },
          { name: "Send the batches", text: "Approve each batch in your wallet. Progress is saved so an interrupted run can resume without duplicates." },
        ]}
      />
      {children}
    </>
  );
}
