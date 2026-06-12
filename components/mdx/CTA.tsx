import Link from "next/link";

const TOOL_ROUTES: Record<string, string> = {
  create: "/create-token",
  pool: "/pool",
  burn: "/burn",
  multisender: "/tools/multisender",
  mintMore: "/tools/mint-tokens",
  updateMetadata: "/tools/update-metadata",
  revokeMint: "/tools/revoke-mint",
  revokeFreeze: "/tools/revoke-freeze",
  revokeUpdate: "/tools/revoke-update",
  makeImmutable: "/tools/make-immutable",
  openbook: "/tools/market/create",
};

const TOOL_LABELS: Record<string, string> = {
  create: "Create your token",
  pool: "Add liquidity",
  burn: "Burn tokens",
  multisender: "Open Multisender",
  mintMore: "Mint more tokens",
  updateMetadata: "Update metadata",
  revokeMint: "Revoke mint authority",
  revokeFreeze: "Revoke freeze authority",
  revokeUpdate: "Revoke update authority",
  makeImmutable: "Make immutable",
  openbook: "Create OpenBook market",
};

export function CTA({ tool, label }: { tool: string; label?: string }) {
  const href = TOOL_ROUTES[tool] ?? "/";
  const text = label ?? TOOL_LABELS[tool] ?? "Open tool";

  return (
    <div className="mdx-cta">
      <Link href={href} className="lp-btn lp-btn--primary">
        {text} →
      </Link>
    </div>
  );
}
