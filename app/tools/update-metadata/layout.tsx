import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Update Solana Token Metadata — Name, Symbol & Logo",
  description:
    "Edit your Solana token's on-chain metadata — name, symbol, logo, and description — through the Metaplex Token Metadata program. 0.05 SOL, only if you hold update authority.",
  path: "/tools/update-metadata",
  ogTitle: "Update Token Metadata",
  ogSub: "Change a token's name, symbol & logo",
  keywords: [
    "update solana token metadata",
    "change token name solana",
    "update token logo solana",
    "edit spl token metadata",
    "metaplex update metadata",
    "fix token metadata solana",
  ],
});

export default function UpdateMetadataLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Update Metadata", url: `${SITE_URL}/tools/update-metadata` },
        ]}
      />
      <JsonLdHowTo
        name="How to update Solana token metadata"
        description="Change a token's name, symbol, logo, or description on-chain."
        steps={[
          { name: "Select the token", text: "Connect the update-authority wallet and choose the token or paste its mint address." },
          { name: "Edit the fields", text: "Update the name, symbol, description, or upload a new logo (re-pinned to IPFS automatically)." },
          { name: "Sign", text: "Approve the transaction. The on-chain metadata updates immediately (allow cache TTL on explorers)." },
        ]}
      />
      {children}
    </>
  );
}
