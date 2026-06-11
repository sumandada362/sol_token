"use client";

import { useEffect } from "react";

/**
 * Cursor-reactive ambient spotlight — tracks pointer position into
 * --mx/--my CSS custom properties consumed by #cursor-spotlight in globals.css.
 * No-ops on touch devices and when prefers-reduced-motion is set.
 */
export default function InteractiveEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
        document.documentElement.style.setProperty("--my", `${e.clientY}px`);
        raf = 0;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div id="cursor-spotlight" aria-hidden="true" />;
}
