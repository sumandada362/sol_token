import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Token Tools — FORGE",
  description: "All Solana token management tools: multisender, mint, metadata, authority revocation, OpenBook market creation, and free converters.",
};

const tools = [
  {
    href: "/tools/multisender",
    icon: "◈",
    name: "Multisender",
    desc: "Send tokens to hundreds of wallets in one transaction batch.",
    fee: "0.05 SOL + rent",
    category: "distribution",
  },
  {
    href: "/tools/mint-tokens",
    icon: "⊕",
    name: "Mint Tokens",
    desc: "Increase token supply by minting new tokens to any wallet.",
    fee: "0.05 SOL",
    category: "supply",
  },
  {
    href: "/tools/update-metadata",
    icon: "✎",
    name: "Update Metadata",
    desc: "Edit your token's name, symbol, logo, and on-chain metadata.",
    fee: "0.05 SOL",
    category: "metadata",
  },
  {
    href: "/tools/revoke-mint",
    icon: "⊘",
    name: "Revoke Mint",
    desc: "Permanently remove mint authority — cap supply forever.",
    fee: "Free",
    category: "authority",
  },
  {
    href: "/tools/revoke-freeze",
    icon: "⊗",
    name: "Revoke Freeze",
    desc: "Remove freeze authority so no wallet can be frozen.",
    fee: "Free",
    category: "authority",
  },
  {
    href: "/tools/make-immutable",
    icon: "◻",
    name: "Make Immutable",
    desc: "Revoke update authority — lock metadata permanently.",
    fee: "Free",
    category: "authority",
  },
  {
    href: "/tools/market/create",
    icon: "⬡",
    name: "OpenBook Market",
    desc: "Create an OpenBook v2 order-book market for your token.",
    fee: "0.05 SOL + pass-through",
    category: "market",
  },
  {
    href: "/tools/unit-converter",
    icon: "⇄",
    name: "Unit Converter",
    desc: "Convert SOL ↔ lamports and token amounts ↔ raw units instantly.",
    fee: "Free",
    category: "utility",
  },
  {
    href: "/tools/sol-converter",
    icon: "$",
    name: "SOL Price Converter",
    desc: "Convert SOL amounts to USD, EUR, BTC and other currencies.",
    fee: "Free",
    category: "utility",
  },
];

const categories = [
  { id: "all", label: "All tools" },
  { id: "distribution", label: "Distribution" },
  { id: "supply", label: "Supply" },
  { id: "metadata", label: "Metadata" },
  { id: "authority", label: "Authority" },
  { id: "market", label: "Market" },
  { id: "utility", label: "Utilities" },
];

export default function ToolsPage() {
  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header page-header--center">
          <h1 className="page-title">Token Tools</h1>
          <p className="page-sub">Everything you need to manage, distribute, and configure your Solana tokens.</p>
        </div>

        <div className="tools-category-row">
          {categories.map((c) => (
            <span key={c.id} className={`tools-cat-chip${c.id === "all" ? " tools-cat-chip--active" : ""}`}>
              {c.label}
            </span>
          ))}
        </div>

        <div className="tools-grid">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="tool-card">
              <div className="tool-card-icon">{t.icon}</div>
              <div className="tool-card-body">
                <div className="tool-card-name">{t.name}</div>
                <div className="tool-card-desc">{t.desc}</div>
              </div>
              <div className="tool-card-footer">
                <span className={`tool-card-fee${t.fee === "Free" ? " tool-card-fee--free" : ""}`}>{t.fee}</span>
                <span className="tool-card-arrow">→</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="tools-cta lp-card">
          <h2 className="tools-cta-title">Just getting started?</h2>
          <p className="lp-body">Create your token first, then use these tools to manage it.</p>
          <div className="lp-actions">
            <Link href="/create" className="lp-btn lp-btn--primary">Create a token</Link>
            <Link href="/docs" className="lp-btn lp-btn--secondary">Read the docs</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
