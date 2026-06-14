import { NextResponse } from "next/server";

/**
 * Maps a caught error to a safe HTTP response.
 * Logs the full error server-side; returns a clean generic message to the client.
 * Never exposes RPC URLs, stack traces, or internal details.
 */
export function apiError(err: unknown, context?: string): NextResponse {
  const raw = err instanceof Error ? err.message : String(err);

  // Not enough SOL is an expected user condition, not a server fault: handle it
  // quietly — NO error log — and return a clear 422 telling the user to fund the
  // wallet. Matched first so it never reaches the console.error below.
  if (raw.includes("[simulation:insufficient-funds]")) {
    return NextResponse.json(
      {
        error:
          "You don't have enough SOL in this wallet to cover the transaction's " +
          "network fees and account rent. Add SOL to this wallet and try again.",
      },
      { status: 422 }
    );
  }

  // Log full error on the server only (genuine / unexpected failures)
  console.error(`[api-error]${context ? ` [${context}]` : ""}`, raw);

  // Authority errors — safe to surface a specific reason (403, not 500)
  if (
    raw.includes("not the mint authority") ||
    raw.includes("not the freeze authority") ||
    raw.includes("not the update authority") ||
    raw.includes("not the authority")
  ) {
    return NextResponse.json(
      { error: "Your wallet is not the authority for this action." },
      { status: 403 }
    );
  }

  // Input errors that bubble up from build functions
  if (raw.includes("not the") && raw.includes("authority")) {
    return NextResponse.json(
      { error: "Your wallet is not the authority for this action." },
      { status: 403 }
    );
  }

  // State errors from our build functions — the action is permanently
  // unavailable for this token (metadata already immutable). Own messages
  // only; safe to surface verbatim.
  if (raw.includes("metadata is immutable") || raw.includes("already immutable")) {
    return NextResponse.json({ error: raw }, { status: 403 });
  }

  // Simulation guard — a non-funding simulation failure (bad account, failing
  // instruction, etc.). The raw on-chain err is logged above. Out-of-SOL is
  // handled earlier and quietly; this neutral message covers everything else.
  if (raw.includes("[simulation]")) {
    return NextResponse.json(
      {
        error:
          "This transaction can't be completed — it failed an on-chain simulation. " +
          "Please double-check your inputs and wallet, then try again.",
      },
      { status: 422 }
    );
  }

  // Everything else: generic 500 — never expose internals
  return NextResponse.json(
    { error: "An error occurred. Please try again." },
    { status: 500 }
  );
}
