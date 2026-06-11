import { isPoolVault } from "./poolVaults";

export type RiskSeverity = "info" | "medium" | "high" | "critical";

export interface RiskFlag {
  id: string;
  label: string;
  severity: RiskSeverity;
}

export interface AuthorityStatus {
  mintAuthority: string | null;
  freezeAuthority: string | null;
  isMutable: boolean;
}

export interface HolderConcentration {
  totalHolders: number | null;
  topHolder: { address: string; pct: number } | null;
  top10Pct: number;
  top10: Array<{ address: string; pct: number; isPool: boolean }>;
}

export interface LiquidityStatus {
  hasLiquidity: boolean;
}

export function computeRiskFlags(
  auth: AuthorityStatus,
  concentration: HolderConcentration,
  liquidity: LiquidityStatus
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (auth.mintAuthority !== null) {
    flags.push({ id: "mint_active", label: "Mint authority active — creator can print more tokens", severity: "high" });
  }

  if (auth.freezeAuthority !== null) {
    flags.push({ id: "freeze_active", label: "Freeze authority active — accounts can be frozen", severity: "high" });
  }

  if (auth.isMutable) {
    flags.push({ id: "metadata_mutable", label: "Metadata is mutable — name/image can be changed", severity: "medium" });
  }

  // Exclude pool vaults before concentration checks
  const nonPoolTop10 = concentration.top10.filter((h) => !h.isPool);
  const nonPoolTop10Pct = nonPoolTop10.reduce((s, h) => s + h.pct, 0);

  if (nonPoolTop10Pct > 70) {
    flags.push({ id: "top10_critical", label: `Top-10 wallets hold ${nonPoolTop10Pct.toFixed(1)}% of supply`, severity: "critical" });
  } else if (nonPoolTop10Pct > 50) {
    flags.push({ id: "top10_high", label: `Top-10 wallets hold ${nonPoolTop10Pct.toFixed(1)}% of supply`, severity: "high" });
  }

  const topNonPool = nonPoolTop10[0];
  if (topNonPool) {
    if (topNonPool.pct > 33) {
      flags.push({ id: "whale_critical", label: `Largest wallet holds ${topNonPool.pct.toFixed(1)}% of supply`, severity: "critical" });
    } else if (topNonPool.pct > 20) {
      flags.push({ id: "whale_high", label: `Largest wallet holds ${topNonPool.pct.toFixed(1)}% of supply`, severity: "high" });
    } else if (topNonPool.pct > 10) {
      flags.push({ id: "whale_medium", label: `Largest wallet holds ${topNonPool.pct.toFixed(1)}% of supply`, severity: "medium" });
    }
  }

  if (!liquidity.hasLiquidity) {
    flags.push({ id: "no_liquidity", label: "No liquidity pool found — token may not be tradeable", severity: "info" });
  }

  return flags;
}

export function enrichTop10WithPoolFlag(
  top10Raw: Array<{ address: string; owner: string; pct: number }>
): Array<{ address: string; pct: number; isPool: boolean }> {
  return top10Raw.map((h) => ({
    address: h.address,
    pct: h.pct,
    isPool: isPoolVault(h.owner),
  }));
}
