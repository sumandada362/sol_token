import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Revoke Freeze Authority on Solana — Prove Tokens Can't Be Frozen",
  description:
    "Permanently remove your token's freeze authority so no holder account can ever be frozen — a core safety signal buyers and DEX scanners check. 0.05 SOL, irreversible.",
  path: "/tools/revoke-freeze",
  ogTitle: "Revoke Freeze Authority",
  ogSub: "No account can ever be frozen",
  keywords: [
    "revoke freeze authority solana",
    "disable freeze solana token",
    "remove freeze authority",
    "solana token safety",
    "renounce freeze authority",
  ],
});

export default function RevokeFreezeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Revoke Freeze Authority", url: `${SITE_URL}/tools/revoke-freeze` },
        ]}
      />
      <JsonLdHowTo
        name="How to revoke freeze authority on Solana"
        description="Permanently disable account freezing for your token."
        steps={[
          { name: "Select the token", text: "Connect the freeze-authority wallet and choose the token or paste its mint address." },
          { name: "Confirm it's irreversible", text: "Once revoked, no token account for this mint can ever be frozen." },
          { name: "Sign", text: "Approve the transaction. The security checker will then show freeze authority as revoked." },
        ]}
      />
      {children}
    </>
  );
}
