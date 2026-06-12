"use client";
import { useEffect, useRef } from "react";

/**
 * Scrolls the window back to the top whenever `key` changes.
 * Used by wizard/tool pages whose main view swaps on a step or phase
 * change — without this the browser keeps the old scroll offset and the
 * (shorter) next view leaves the user staring at the footer.
 * Skips the initial mount so pages don't jump on load.
 *
 * Pass the rendered VIEW as the key, not the raw phase: transient phases
 * (checking, signing) render inside the same view and must not scroll.
 */
export function useScrollToTopOn(key: unknown) {
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }, [key]);
}
