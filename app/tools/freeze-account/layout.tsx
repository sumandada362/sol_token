import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Freeze a Solana Token Account — Block Transfers",
  description:
    "Freeze specific holder token accounts to block transfers for your SPL or Token-2022 token — requires freeze authority. 0.01 SOL per address, signed from your wallet.",
  path: "/tools/freeze-account",
  ogTitle: "Freeze Token Account",
  ogSub: "Block transfers for specific wallets",
  keywords: [
    "freeze solana token account",
    "block token transfers solana",
    "freeze spl token account",
    "solana freeze authority tool",
    "freeze wallet token",
  ],
});

export default function FreezeAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Freeze Account", url: `${SITE_URL}/tools/freeze-account` },
        ]}
      />
      <JsonLdHowTo
        name="How to freeze a Solana token account"
        description="Freeze a holder's token account to block transfers."
        steps={[
          { name: "Select the token", text: "Connect the freeze-authority wallet and choose the token or paste its mint address." },
          { name: "Enter the wallet(s)", text: "Add the holder wallet addresses whose token accounts you want to freeze." },
          { name: "Sign", text: "Approve the transaction. The frozen accounts can no longer send or receive until thawed." },
        ]}
      />
      {children}
    </>
  );
}
