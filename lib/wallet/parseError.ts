/**
 * Converts a raw Solana/wallet error into a short user-facing message.
 * Logs unexpected errors to the console for debugging; expected user conditions
 * (cancelled, not enough SOL) are returned quietly without logging.
 */
export function parseError(err: unknown, context?: string): string {
  const raw = err instanceof Error ? err.message : String(err);

  // User cancelled in wallet — expected, not a bug: return without logging.
  if (/user rejected|rejected the request|user denied/i.test(raw))
    return "Transaction cancelled.";

  // Not enough SOL — expected user condition, not a bug: return WITHOUT logging.
  // Pass the server's already-clean message straight through; fall back to a
  // concise message for raw on-chain errors.
  if (/enough sol|need real sol|add sol|insufficient.*lamport|insufficient.*fund|custom program error: 0x1/i.test(raw))
    return /enough sol|need real sol|add sol/i.test(raw) && raw.length < 320
      ? raw
      : "Not enough SOL in your wallet to cover network fees and rent. Add SOL and try again.";

  // Unexpected error — log it for debugging, then map to a safe user message.
  console.error(`[tx-error]${context ? ` [${context}]` : ""}`, err);

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
