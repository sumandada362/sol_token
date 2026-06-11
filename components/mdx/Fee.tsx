import { FEES } from "@/lib/solana/fees";

const TOOL_LABELS: Record<string, string> = {
  create: "Create Token",
  mintMore: "Mint More",
  updateMetadata: "Update Metadata",
  revokeMint: "Revoke Mint Authority",
  revokeFreeze: "Revoke Freeze Authority",
  makeImmutable: "Make Immutable",
  burn: "Burn Tokens",
};

const FEE_KEYS: Record<string, keyof typeof FEES> = {
  create: "createToken",
  mintMore: "mintMore",
  updateMetadata: "updateMetadata",
  revokeMint: "revokeMint",
  revokeFreeze: "revokeFreeze",
  makeImmutable: "makeImmutable",
  burn: "burn",
};

export function Fee({ tool }: { tool: string }) {
  const key = FEE_KEYS[tool];
  const amount = key !== undefined ? FEES[key] : null;
  const label = TOOL_LABELS[tool] ?? tool;

  return (
    <span className="fee-badge">
      {label}:{" "}
      <strong>{amount === 0 ? "Free" : amount !== null ? `${amount} SOL` : "see pricing"}</strong>
    </span>
  );
}
