"use client";
import { useEffect, useRef, useState } from "react";
import { phantomBrowseLink, solflareBrowseLink } from "@/lib/wallet/mobile";

/**
 * iOS connect affordance. On iOS Safari there is no injected wallet and no
 * Mobile Wallet Adapter, so the normal wallet modal can only show "install"
 * links — useless for connecting. Instead we deep-link the user into a wallet's
 * in-app browser, where the site reloads with the wallet provider injected and
 * the existing Phantom/Solflare adapters work normally.
 */
export default function MobileWalletButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // The current page — so the wallet's browser lands the user back where they were.
  const here = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="wallet-chip" ref={ref}>
      <button
        className="nav-cta"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Open in Wallet
      </button>

      {open && (
        <div className="wallet-chip-menu" role="menu">
          <a role="menuitem" href={phantomBrowseLink(here)}>
            Open in Phantom
          </a>
          <a role="menuitem" href={solflareBrowseLink(here)}>
            Open in Solflare
          </a>
        </div>
      )}
    </div>
  );
}
