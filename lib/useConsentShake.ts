"use client";
import { useRef, useState } from "react";

/**
 * Feedback for consent-gated actions. Instead of disabling the action button
 * (which silently swallows the click), keep the button enabled and call guard()
 * in its onClick. If the consent box isn't ticked, the consent row shakes to
 * draw the eye and the action is blocked.
 *
 * Usage:
 *   const { shakeClass, guard } = useConsentShake();
 *   <label className={`revoke-confirm-check ${shakeClass}`}> … </label>
 *   <button onClick={() => { if (guard(confirmed)) doThing(); }}>…</button>
 */
export function useConsentShake() {
  const [shaking, setShaking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Returns true if confirmed (proceed); otherwise shakes the row and returns false. */
  function guard(confirmed: boolean): boolean {
    if (confirmed) return true;
    if (timer.current) clearTimeout(timer.current);
    setShaking(true);
    timer.current = setTimeout(() => setShaking(false), 500);
    return false;
  }

  return { shakeClass: shaking ? "consent-shake" : "", guard };
}
