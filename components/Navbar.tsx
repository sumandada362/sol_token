"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [connected, setConnected] = useState(false);
  const [chipOpen, setChipOpen] = useState(false);
  const [address] = useState("7xKq...3fBn");
  const chipRef = useRef<HTMLDivElement>(null);

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
    { href: "/create", label: "Create" },
    { href: "/explore", label: "Explore" },
    { href: "/pricing", label: "Pricing" },
    { href: "/docs", label: "Docs" },
  ];

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

      {connected ? (
        <div className="wallet-chip" ref={chipRef}>
          <button
            className="wallet-chip-btn"
            onClick={() => setChipOpen((o) => !o)}
            aria-expanded={chipOpen}
            aria-haspopup="menu"
          >
            <span className="wallet-chip-dot" />
            {address}
            <span className="wallet-chip-caret" aria-hidden>▾</span>
          </button>

          {chipOpen && (
            <div className="wallet-chip-menu" role="menu">
              <button role="menuitem" onClick={() => { navigator.clipboard.writeText("7xKq3fBnFullAddress"); setChipOpen(false); }}>
                Copy address
              </button>
              <a role="menuitem" href="https://solscan.io" target="_blank" rel="noopener noreferrer" onClick={() => setChipOpen(false)}>
                View on Solscan
              </a>
              <button role="menuitem" onClick={() => setChipOpen(false)}>
                Change wallet
              </button>
              <div className="wallet-chip-divider" />
              <div className="wallet-chip-network">
                <span className="wallet-chip-net-dot" />
                Mainnet
              </div>
              <div className="wallet-chip-divider" />
              <button role="menuitem" className="wallet-chip-disconnect" onClick={() => { setConnected(false); setChipOpen(false); }}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className="nav-cta" onClick={() => setConnected(true)}>
          Connect Wallet
        </button>
      )}
    </nav>
  );
}
