import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Unfreeze (Thaw) a Solana Token Account — Restore Transfers",
  description:
    "Restore transfers to a previously frozen SPL or Token-2022 account by thawing it — requires freeze authority. 0.01 SOL per address.",
  path: "/tools/unfreeze-account",
  ogTitle: "Unfreeze Token Account",
  ogSub: "Thaw a frozen account to restore transfers",
  keywords: [
    "unfreeze solana token account",
    "thaw spl token account",
    "restore token transfers solana",
    "unfreeze wallet solana",
  ],
});

export default function UnfreezeAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Unfreeze Account", url: `${SITE_URL}/tools/unfreeze-account` },
        ]}
      />
      <JsonLdHowTo
        name="How to unfreeze a Solana token account"
        description="Thaw a frozen token account to restore transfers."
        steps={[
          { name: "Select the token", text: "Connect the freeze-authority wallet and choose the token or paste its mint address." },
          { name: "Enter the wallet(s)", text: "Add the holder wallet addresses whose accounts you want to thaw." },
          { name: "Sign", text: "Approve the transaction. The accounts can transfer again immediately." },
        ]}
      />
      {children}
    </>
  );
}
