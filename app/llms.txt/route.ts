import { SITE_URL } from "@/lib/seo";

// /llms.txt — a concise, machine-readable summary for AI answer engines
// (ChatGPT, Perplexity, Google AI Overviews). https://llmstxt.org
export function GET() {
  const u = (p: string) => `${SITE_URL}${p}`;
  const body = `# Solana Token

> Dravyo Solana Token creator is the fastest and safest way to create and launch tokens on Solana — a free, no-code web app for SPL and Token-2022 tokens, used directly from your own wallet. No coding, no complexity: customize your token in a few clicks. It is non-custodial — keys never leave your wallet — with transparent flat fees.

## What you can do
- [Create a Solana token](${u("/create-token")}): SPL or Token-2022 with a logo, on-chain metadata, and optional one-click authority revocation. From 0.1 SOL.
- [Multisender / airdrop](${u("/tools/multisender")}): bulk-send SPL or Token-2022 tokens to hundreds of wallets from a CSV. 0.02 SOL per batch.
- [Mint more tokens](${u("/tools/mint-tokens")}): increase supply if you kept mint authority. 0.05 SOL.
- [Burn tokens](${u("/burn")}): permanently reduce total supply. Free (network gas only).
- [Update metadata](${u("/tools/update-metadata")}): change name, symbol, logo, description. 0.05 SOL.
- [Revoke mint authority](${u("/tools/revoke-mint")}): cap supply forever. 0.05 SOL.
- [Revoke freeze authority](${u("/tools/revoke-freeze")}): prove accounts can't be frozen. 0.05 SOL.
- [Make immutable](${u("/tools/make-immutable")}): lock metadata permanently. Free.
- [Freeze](${u("/tools/freeze-account")}) / [unfreeze](${u("/tools/unfreeze-account")}) token accounts. 0.01 SOL per address.

## Key facts
- Non-custodial: the app never holds private keys or funds; every action is signed by the user's wallet (Phantom, Solflare, Backpack).
- Supports both the SPL Token and Token-2022 standards across every tool.
- Flat, transparent fees shown before signing: create 0.1 SOL; mint/update/revoke 0.05 SOL each; freeze 0.01 SOL per address; burn and make-immutable are free.
- Security checker shows authority status and holder concentration for any token.

## Docs and guides
- [Documentation](${u("/docs")})
- [Blog and how-to guides](${u("/blog")})
- [FAQ](${u("/docs/faq")})
- [Fees and costs](${u("/docs/fees-and-costs")})
`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
