"use client";
import { useEffect, useState } from "react";

const PHRASES  = ["No Coding", "No Complexity"];
const TYPE_MS  = 78;
const ERASE_MS = 42;
const HOLD_MS  = 1500;
const PAUSE_MS = 320;

export default function Typewriter() {
  const [display, setDisplay]     = useState("");
  const [phase, setPhase]         = useState<"typing" | "erasing">("typing");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [reduced, setReduced]     = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const phrase = PHRASES[phraseIdx];

    if (phase === "typing") {
      if (display.length < phrase.length) {
        const t = setTimeout(
          () => setDisplay(phrase.slice(0, display.length + 1)),
          TYPE_MS,
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("erasing"), HOLD_MS);
      return () => clearTimeout(t);
    }

    if (phase === "erasing") {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay((d) => d.slice(0, -1)), ERASE_MS);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setPhraseIdx((i) => (i + 1) % PHRASES.length);
        setPhase("typing");
      }, PAUSE_MS);
      return () => clearTimeout(t);
    }
  }, [display, phase, phraseIdx, reduced]);

  if (reduced) return <span>No Coding, No Complexity</span>;

  return (
    <span className="typewriter" aria-label="No Coding, No Complexity">
      {display}
      <span className="typewriter-cursor" aria-hidden>|</span>
    </span>
  );
}
