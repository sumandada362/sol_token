import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";

// Curated token landing pages for high-intent "bulk send <token>" searches.
const KNOWN: Record<string, { name: string; blurb: string }> = {
  sol: { name: "SOL", blurb: "Bulk send SOL to hundreds of wallets at once" },
  usdc: { name: "USDC", blurb: "Airdrop USDC to many Solana wallets in batches" },
  usdt: { name: "USDT", blurb: "Airdrop USDT to many Solana wallets in batches" },
  bonk: { name: "BONK", blurb: "Bulk send BONK to your community in one flow" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const key = token.toLowerCase();
  const known = KNOWN[key];

  // Mint-address routes just redirect — don't index them.
  if (!known) {
    return {
      title: `Multisender | Solana Token`,
      robots: { index: false, follow: true },
      alternates: { canonical: `${SITE_URL}/tools/multisender` },
    };
  }

  return pageMeta({
    title: `Bulk Send ${known.name} on Solana — Multisender`,
    description: `${known.blurb}. Upload a CSV of addresses and amounts, preview totals, and send in batched transactions — recipient accounts created automatically.`,
    path: `/tools/multisender/${key}`,
    ogTitle: `Bulk Send ${known.name}`,
    ogSub: known.blurb,
    keywords: [
      `bulk send ${known.name.toLowerCase()} solana`,
      `airdrop ${known.name.toLowerCase()} solana`,
      `send ${known.name.toLowerCase()} to multiple wallets`,
      "solana multisender",
    ],
  });
}

export default function MultisenderTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
