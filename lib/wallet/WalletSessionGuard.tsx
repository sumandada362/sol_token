"use client";
import { ReactNode, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Caps the persistent wallet session at 21 days.
 *
 * Semantics:
 * - An explicit connection approval starts a 21-day window. Silent autoConnect
 *   restores on later visits do NOT extend it — the window is anchored to the
 *   moment the user actually approved.
 * - After 21 days the app disconnects and clears the adapter's remembered
 *   wallet, so the next visit requires an explicit reconnect (which starts a
 *   fresh window).
 * - Manual disconnect ends the session immediately; reconnecting starts fresh.
 * - Switching to a different account in the wallet starts a fresh window for
 *   that account (it is a deliberate user action).
 *
 * Note: this governs the app's auto-reconnect only. The wallet extension keeps
 * its own site-trust list; users revoke that inside Phantom/Solflare settings.
 */

const SESSION_KEY = "solana_token_wallet_session";
// Default localStorage key used by @solana/wallet-adapter-react for autoConnect
const ADAPTER_KEY = "walletName";
export const SESSION_TTL_MS = 21 * 24 * 60 * 60 * 1000; // 21 days
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // re-check hourly in long-lived tabs

interface SessionRecord {
  wallet: string;
  approvedAt: number;
}

function readSession(): SessionRecord | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionRecord;
    if (typeof parsed.wallet !== "string" || typeof parsed.approvedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function WalletSessionGuard({ children }: { children: ReactNode }) {
  const { connected, publicKey, disconnect } = useWallet();
  const wasConnected = useRef(false);

  useEffect(() => {
    if (!connected || !publicKey) {
      // A true→false transition while the tab is alive is a deliberate
      // disconnect — end the session so the next connect starts a fresh window.
      if (wasConnected.current) {
        localStorage.removeItem(SESSION_KEY);
      }
      wasConnected.current = false;
      return;
    }
    wasConnected.current = true;

    const wallet = publicKey.toBase58();

    const check = () => {
      const rec = readSession();
      if (!rec || rec.wallet !== wallet) {
        // First approval for this account (or a deliberate account switch) —
        // anchor a fresh 21-day window.
        localStorage.setItem(SESSION_KEY, JSON.stringify({ wallet, approvedAt: Date.now() }));
        return;
      }
      if (Date.now() - rec.approvedAt > SESSION_TTL_MS) {
        localStorage.removeItem(SESSION_KEY);
        // Clear the adapter's remembered wallet so autoConnect cannot silently
        // restore the session on the next visit.
        localStorage.removeItem(ADAPTER_KEY);
        void disconnect().catch(() => {
          // Wallet may already be locked/unreachable — clearing storage above
          // is what actually prevents the session from persisting.
        });
      }
    };

    check();
    const t = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(t);
  }, [connected, publicKey, disconnect]);

  return <>{children}</>;
}
