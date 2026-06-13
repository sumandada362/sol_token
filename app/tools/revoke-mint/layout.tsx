import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Revoke Mint Authority on Solana — Cap Token Supply",
  description:
    "Permanently revoke your token's mint authority so no new tokens can ever be created — a key trust signal that proves a fixed supply. 0.05 SOL, irreversible, signed from your wallet.",
  path: "/tools/revoke-mint",
  ogTitle: "Revoke Mint Authority",
  ogSub: "Lock supply — no more tokens can be minted",
  keywords: [
    "revoke mint authority solana",
    "cap token supply solana",
    "fixed supply solana token",
    "disable minting solana",
    "renounce mint authority",
    "lock token supply",
  ],
});

export default function RevokeMintLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Revoke Mint Authority", url: `${SITE_URL}/tools/revoke-mint` },
        ]}
      />
      <JsonLdHowTo
        name="How to revoke mint authority on Solana"
        description="Permanently disable minting so the token supply is fixed forever."
        steps={[
          { name: "Select the token", text: "Connect the mint-authority wallet and choose the token or paste its mint address." },
          { name: "Confirm it's irreversible", text: "Revoking mint authority is permanent — no more tokens can ever be minted afterward." },
          { name: "Sign", text: "Approve the transaction. The security checker will then show mint authority as revoked." },
        ]}
      />
      {children}
    </>
  );
}
