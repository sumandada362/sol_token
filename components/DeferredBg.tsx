"use client";
import dynamic from "next/dynamic";

/**
 * The WebGL accretion-disc background is purely decorative and ships a large
 * chunk (shaders + worker source). Load it client-side only, after hydration,
 * so it stays out of the initial JS the page needs to become interactive.
 * ssr: false also avoids rendering an empty <canvas> in the prerendered HTML.
 */
const BgCanvas = dynamic(() => import("./BgCanvas"), { ssr: false });

export default function DeferredBg() {
  return <BgCanvas />;
}
