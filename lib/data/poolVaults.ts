// Known liquidity-pool vault program IDs + vault patterns.
// We exclude any token account whose *owner* is one of these program IDs
// when computing largest-holder and top-10 concentration, because LP vaults
// look like single massive holders but represent pooled liquidity.

export const POOL_PROGRAM_IDS = new Set([
  // Raydium AMM v4
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  // Raydium CLMM (concentrated)
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
  // Orca Whirlpools
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
  // Orca v1 token-swap
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",
  // Meteora DLMM
  "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
  // Meteora pools
  "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EkAW7cP",
  // Jupiter aggregator vaults (routing)
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  // OpenBook (Serum) DEX
  "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX",
]);

export function isPoolVault(ownerPubkey: string): boolean {
  return POOL_PROGRAM_IDS.has(ownerPubkey);
}
