/**
 * Converts a raw Solana/wallet error into a short user-facing message.
 * Always logs the full error to the console so you can debug.
 */
export function parseError(err: unknown, context?: string): string {
  const raw = err instanceof Error ? err.message : String(err);
  console.error(`[tx-error]${context ? ` [${context}]` : ""}`, err);

  // User cancelled in wallet
  if (/user rejected|rejected the request|user denied/i.test(raw))
    return "Transaction cancelled.";

  // Not enough SOL
  if (
    /insufficient.*lamport|insufficient.*fund|0x1\b/i.test(raw) ||
    raw.includes("custom program error: 0x1")
  )
    return "Insufficient SOL balance. Top up your wallet and try again.";

  // Blockhash expired / network busy
  if (/blockhash.*not found|block height exceeded/i.test(raw))
    return "Network is busy — please try again.";

  // Transaction timed out waiting for confirmation
  if (/transaction.*not confirmed|timed out|timeout/i.test(raw))
    return "Transaction timed out. Check your wallet — it may have gone through.";

  // Wallet not connected
  if (/wallet not connected|no wallet/i.test(raw))
    return "Wallet not connected. Please connect your wallet first.";

  // Wrong authority (from our server)
  if (/not the.*authority|not the mint|not the freeze|not the update/i.test(raw))
    return "Your wallet is not the authority for this token.";

  // Already revoked
  if (/already.*null|authority.*already/i.test(raw))
    return "This authority has already been revoked.";

  // IPFS upload
  if (/ipfs.*upload|pinata|upload failed/i.test(raw))
    return "Logo upload failed. Please try again.";

  // Server returned a clean error message (from apiError)
  if (raw.length < 120 && !raw.includes("Program") && !raw.includes("0x"))
    return raw;

  // Everything else — hide internals
  return "Something went wrong. Please try again.";
}
