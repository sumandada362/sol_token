"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function MotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    let obs: IntersectionObserver | null = null;

    const rafId = requestAnimationFrame(() => {
      const els = document.querySelectorAll<HTMLElement>("[data-reveal], [data-stagger]");
      if (!els.length) return;

      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).dataset.visible = "true";
              obs!.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -32px 0px" }
      );

      els.forEach((el) => obs!.observe(el));
    });

    return () => {
      cancelAnimationFrame(rafId);
      obs?.disconnect();
    };
  }, [pathname]);

  return null;
}
