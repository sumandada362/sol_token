"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { isMobileBrowser } from "@/lib/wallet/mobile";
import MobileWalletButton from "@/components/MobileWalletButton";

function shortAddress(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// navigator.clipboard is undefined in non-secure contexts / some mobile webviews —
// guard so a copy tap never throws an unhandled error.
function copyText(text: string) {
  try {
    navigator.clipboard?.writeText(text);
  } catch {
    /* clipboard unavailable — ignore */
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const [chipOpen, setChipOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const { connected, publicKey, disconnect, wallets } = useWallet();
  const { setVisible } = useWalletModal();

  // Detection touches navigator, so defer to after mount to avoid an SSR/client
  // hydration mismatch on the connect control. A one-shot mount flag is exactly
  // the case where a synchronous setState in an effect is correct.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // On a plain mobile browser (iOS Safari AND Android Chrome) there is no injected
  // wallet, and the in-modal Mobile Wallet Adapter handshake is unreliable on a
  // deployed HTTPS site (and silently fails behind CSP). The robust path on BOTH
  // platforms is to deep-link the user into a wallet's in-app browser, where the
  // site reloads with window.solana injected and connect works normally. Once a
  // wallet IS injected (incl. inside a wallet's in-app browser), use the modal.
  const hasInjectedWallet = wallets.some((w) => w.readyState === WalletReadyState.Installed);
  const useDeepLink = mounted && isMobileBrowser() && !hasInjectedWallet;

  useEffect(() => {
    // A click anywhere outside the navbar closes both the mobile menu and the
    // wallet-chip dropdown (the chip is rendered inside the navbar in both layouts).
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setChipOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Close the mobile menu (and any chip dropdown) on navigation — resetting UI
  // state in response to a route change is a valid synchronous-setState effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setMenuOpen(false);
    setChipOpen(false);
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const navLinks = [
    { href: "/create-token", label: "Create" },
    { href: "/pool", label: "Liquidity" },
    { href: "/tools", label: "Tools" },
    { href: "/docs", label: "Docs" },
    { href: "/blog", label: "Blog" },
  ];

  const address = publicKey?.toBase58() ?? "";
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  // The connect control — wallet chip when connected, the iOS deep-link button, or
  // the Connect button. Rendered in two spots (navbar on desktop, inside the
  // hamburger dropdown on mobile); CSS reveals only the one for the active layout.
  // A function so each placement renders its own element tree.
  const renderWalletControl = () => {
    if (connected && publicKey) {
      return (
        <div className="wallet-chip">
          <button
            className="wallet-chip-btn"
            onClick={() => setChipOpen((o) => !o)}
            aria-expanded={chipOpen}
            aria-haspopup="menu"
          >
            <span className="wallet-chip-dot" />
            {shortAddress(address)}
            <span className="wallet-chip-caret" aria-hidden>▾</span>
          </button>

          {chipOpen && (
            <div className="wallet-chip-menu" role="menu">
              <button
                role="menuitem"
                onClick={() => { copyText(address); setChipOpen(false); }}
              >
                Copy address
              </button>
              <a
                role="menuitem"
                href={`https://solscan.io/account/${address}?cluster=${network}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setChipOpen(false)}
              >
                View on Solscan
              </a>
              <button role="menuitem" onClick={() => { setVisible(true); setChipOpen(false); }}>
                Change wallet
              </button>
              <div className="wallet-chip-divider" />
              <div className="wallet-chip-network">
                <span className="wallet-chip-net-dot" />
                {network.charAt(0).toUpperCase() + network.slice(1)}
              </div>
              <div className="wallet-chip-divider" />
              <button
                role="menuitem"
                className="wallet-chip-disconnect"
                onClick={() => { disconnect(); setChipOpen(false); }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      );
    }
    if (useDeepLink) return <MobileWalletButton />;
    return (
      <button className="nav-cta" onClick={() => setVisible(true)}>
        Connect Wallet
      </button>
    );
  };

  return (
    <nav id="navbar" ref={navRef}>
      <Link href="/" className="nav-logo">
        <Image
          src="/coin_gold_mark.png"
          alt="Solana Token"
          width={44}
          height={44}
          className="nav-logo-mark"
          priority
        />
        Solana Token
      </Link>

      <ul className={`nav-links${menuOpen ? " nav-links--open" : ""}`}>
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={pathname === href || pathname.startsWith(href + "/") ? "nav-active" : ""}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          </li>
        ))}
        {/* Connect control inside the mobile dropdown (hidden on desktop via CSS) */}
        <li className="nav-links__wallet">{renderWalletControl()}</li>
      </ul>

      <div className="nav-right">
        {/* Connect control in the navbar (hidden on mobile via CSS) */}
        <div className="nav-wallet-desktop">{renderWalletControl()}</div>
        <button
          className="nav-burger"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="navbar"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </nav>
  );
}
