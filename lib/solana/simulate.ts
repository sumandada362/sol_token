import type { Connection, Transaction } from "@solana/web3.js";

/** Best-effort detection of an "out of SOL" failure from a simulation result. */
function isInsufficientFunds(err: unknown, logs: string): boolean {
  const hay = `${JSON.stringify(err ?? "")} ${logs}`.toLowerCase();
  return (
    hay.includes("insufficient") || // insufficient funds / lamports / InsufficientFundsForRent
    hay.includes("found no record of a prior credit") || // fee payer has 0 SOL
    hay.includes("accountnotfound") // fee-payer wallet unfunded — doesn't exist on-chain yet
  );
}

/**
 * Server-side dry-run of a transaction before it's serialized to the browser.
 *
 * Why this exists: the wallet (Phantom) simulates every transaction in its
 * approval UI. If a transaction can't be simulated it shows
 * "Failed to simulate the results of this request" and Blowfish treats it as
 * higher-risk. Catching genuine failures here lets us return a precise,
 * actionable reason (e.g. not enough SOL) instead of the user clicking
 * "Create" and only then hitting that opaque wallet error.
 *
 * IMPORTANT — what this does and does not catch:
 *   • Catches instruction-level failures: insufficient SOL for fees/rent,
 *     bad/uninitialized accounts, a program instruction that errors.
 *   • Does NOT catch an app↔wallet *cluster mismatch*. That's a config issue:
 *     the server RPC pool (app_configs/integrations.ts → RPC_ENDPOINTS) and
 *     NEXT_PUBLIC_RPC_URL must be on the same cluster the user's wallet is set
 *     to. This dry-run runs against OUR RPC, so a tx that is fine on our cluster
 *     still fails in the wallet if the wallet is on a different one. The startup
 *     guardrail in rpcPool.ts covers the server RPC/network match.
 *
 * Fail-soft: a transport/RPC error never blocks the user — infra flakiness
 * shouldn't stop a valid transaction. Only a definitive on-chain simulation
 * error throws. Set SKIP_TX_SIMULATION=1 to bypass entirely (kill switch if it
 * ever misfires in production).
 */
export async function assertSimulates(
  connection: Connection,
  tx: Transaction,
  label: string,
): Promise<void> {
  if (process.env.SKIP_TX_SIMULATION === "1") return;

  try {
    // Legacy Transaction, no signers → simulated with sigVerify off and a fresh
    // blockhash, so an unsigned build (mint keypair signs client-side) is fine.
    const { value } = await connection.simulateTransaction(tx);
    if (value.err) {
      const logs = (value.logs ?? []).join("\n");
      if (isInsufficientFunds(value.err, logs)) {
        // Expected user condition (wallet has no / too little SOL) — not a fault,
        // so we do NOT log it. The marker lets errors.ts return a clear 422.
        throw new Error(`[simulation:insufficient-funds] ${label}`);
      }
      // Genuine, unexpected simulation failure — log details for debugging.
      console.error(`[simulate:${label}] err=${JSON.stringify(value.err)} logs=`, value.logs);
      throw new Error(`[simulation] ${label} would fail on-chain: ${JSON.stringify(value.err)}`);
    }
  } catch (e) {
    // Re-throw our own definitive simulation failures (both markers start with
    // "[simulation"); a transport/RPC error (infra flakiness) must never block
    // an otherwise-valid transaction.
    if (e instanceof Error && e.message.startsWith("[simulation")) throw e;
    console.warn(`[simulate:${label}] dry-run could not run (ignored):`, e);
  }
}
