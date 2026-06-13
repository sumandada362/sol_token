import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Make a Solana Token Immutable — Lock Metadata (Free)",
  description:
    "Permanently lock your Solana token's metadata so the name, symbol, and logo can never be changed — a free alternative to revoking update authority. Irreversible.",
  path: "/tools/make-immutable",
  ogTitle: "Make Token Immutable",
  ogSub: "Lock metadata forever — free",
  keywords: [
    "make solana token immutable",
    "lock token metadata solana",
    "immutable spl token",
    "freeze token metadata",
    "permanent token metadata",
  ],
});

export default function MakeImmutableLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Tools", url: `${SITE_URL}/tools` },
          { name: "Make Immutable", url: `${SITE_URL}/tools/make-immutable` },
        ]}
      />
      <JsonLdHowTo
        name="How to make a Solana token immutable"
        description="Permanently lock a token's metadata so it can never be edited."
        steps={[
          { name: "Select the token", text: "Connect the update-authority wallet and choose the token or paste its mint address." },
          { name: "Confirm", text: "Making metadata immutable is permanent and free (only network gas)." },
          { name: "Sign", text: "Approve the transaction. The metadata is locked and the token shows as immutable." },
        ]}
      />
      {children}
    </>
  );
}
