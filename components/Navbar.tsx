"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { isIOS } from "@/lib/wallet/mobile";
import MobileWalletButton from "@/components/MobileWalletButton";

function shortAddress(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const [chipOpen, setChipOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);

  const { connected, publicKey, disconnect, wallets } = useWallet();
  const { setVisible } = useWalletModal();

  // Detection touches navigator, so defer to after mount to avoid an SSR/client
  // hydration mismatch on the connect control.
  useEffect(() => setMounted(true), []);

  // On iOS Safari there is no injected wallet and no Mobile Wallet Adapter, so the
  // standard modal can't connect — route the user into a wallet's in-app browser
  // instead. Android is handled by the Mobile Wallet Adapter inside the modal, and
  // an already-injected wallet (incl. wallet in-app browsers) uses the modal too.
  const hasInjectedWallet = wallets.some((w) => w.readyState === WalletReadyState.Installed);
  const useDeepLink = mounted && isIOS() && !hasInjectedWallet;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (chipRef.current && !chipRef.current.contains(e.target as Node)) {
        setChipOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const navLinks = [
    { href: "/create-token", label: "Create" },
    { href: "/pool", label: "Liquidity" },
    { href: "/tools", label: "Tools" },
    { href: "/docs", label: "Docs" },
    { href: "/blog", label: "Blog" },
  ];

  const address = publicKey?.toBase58() ?? "";
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  return (
    <nav id="navbar">
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

      <ul className="nav-links">
        {navLinks.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className={pathname === href || pathname.startsWith(href + "/") ? "nav-active" : ""}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {connected && publicKey ? (
        <div className="wallet-chip" ref={chipRef}>
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
                onClick={() => { navigator.clipboard.writeText(address); setChipOpen(false); }}
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
      ) : useDeepLink ? (
        <MobileWalletButton />
      ) : (
        <button className="nav-cta" onClick={() => setVisible(true)}>
          Connect Wallet
        </button>
      )}
    </nav>
  );
}
