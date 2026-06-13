import type { Metadata } from "next";
import { JsonLdBreadcrumb, JsonLdHowTo } from "@/components/JsonLd";

const BASE = "https://solanatoken.app";
const TITLE = "Revoke Update Authority on a Solana Token — Solana Token";
const DESCRIPTION =
  "Permanently revoke your Solana token's update authority so the name, symbol, and logo can never be changed. Flat 0.05 SOL fee, done in one transaction.";
const OG_URL = `${BASE}/og?title=${encodeURIComponent("Revoke Update Authority")}&sub=${encodeURIComponent(
  "Lock your Solana token's metadata permanently"
)}`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "revoke update authority solana",
    "solana update authority",
    "lock token metadata solana",
    "solana token immutable",
    "spl token update authority",
    "remove update authority",
  ],
  alternates: { canonical: `${BASE}/tools/revoke-update` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}/tools/revoke-update`,
    images: [{ url: OG_URL, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_URL],
  },
};

export default function RevokeUpdateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLdBreadcrumb
        items={[
          { name: "Home", url: BASE },
          { name: "Tools", url: `${BASE}/tools` },
          { name: "Revoke Update Authority", url: `${BASE}/tools/revoke-update` },
        ]}
      />
      <JsonLdHowTo
        name="How to revoke update authority on a Solana token"
        description="Permanently remove the update authority from a Solana token so its metadata can never be changed."
        steps={[
          { name: "Open the tool", text: "Go to solanatoken.app/tools/revoke-update and connect the wallet that holds the update authority." },
          { name: "Enter your mint address", text: "Paste the token's mint address. Solana Token verifies on-chain that your wallet is the current update authority." },
          { name: "Confirm the irreversible action", text: "Check the confirmation box acknowledging the revocation is permanent." },
          { name: "Sign the transaction", text: "Approve the transaction in your wallet. The update authority is transferred to the system program, which can never sign." },
        ]}
      />
      {children}
    </>
  );
}
