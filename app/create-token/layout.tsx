import type { Metadata } from "next";
import { pageMeta, SITE_URL } from "@/lib/seo";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

export const metadata: Metadata = pageMeta({
  title: "Create a Solana Token (SPL & Token-2022) — No Code",
  description:
    "Create your own Solana token in minutes — SPL or Token-2022, with a logo, on-chain metadata, and optional one-click authority revocation. No coding. From 0.1 SOL, signed entirely from your own wallet.",
  path: "/create-token",
  ogTitle: "Create a Solana Token",
  ogSub: "SPL & Token-2022 · no code · from 0.1 SOL",
  keywords: [
    "create solana token",
    "solana token creator",
    "make a solana token",
    "spl token creator",
    "token 2022 creator",
    "launch solana token",
    "create meme coin solana",
    "no-code solana token maker",
    "how to create a solana token",
  ],
});

export default function CreateTokenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: SITE_URL },
          { name: "Create Token", url: `${SITE_URL}/create-token` },
        ]}
      />
      <JsonLdHowTo
        name="How to create a Solana token"
        description="Create an SPL or Token-2022 token on Solana with metadata and a logo — no code."
        steps={[
          { name: "Connect your wallet", text: "Open Solana Token, connect Phantom, Solflare, or Backpack, and choose SPL or Token-2022." },
          { name: "Enter token details", text: "Set the name, symbol, decimals, total supply, and upload a logo image (PNG/JPG/WebP)." },
          { name: "Choose safety options", text: "Optionally revoke mint and freeze authority at creation, or add a custom creator." },
          { name: "Sign and launch", text: "Approve the transaction in your wallet. Your token is minted on-chain with metadata in one signing flow." },
        ]}
      />
      {children}
    </>
  );
}
