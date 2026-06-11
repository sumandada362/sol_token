"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useEffect } from "react";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

function shortAddress(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const [chipOpen, setChipOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);

  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

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
    { href: "/tools", label: "Tools" },
    { href: "/blog", label: "Blog" },
    { href: "/docs", label: "Docs" },
  ];

  const address = publicKey?.toBase58() ?? "";
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  return (
    <nav id="navbar">
      <Link href="/" className="nav-logo">
        FORGE
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
      ) : (
        <button className="nav-cta" onClick={() => setVisible(true)}>
          Connect Wallet
        </button>
      )}
    </nav>
  );
}
