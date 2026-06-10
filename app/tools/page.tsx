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

const feeNotes: Record<string, string> = {
  "/tools/multisender":      "Plus ~0.002 SOL Solana rent per new recipient account",
  "/tools/mint-tokens":      "Requires active mint authority on the token",
  "/tools/update-metadata":  "Requires update authority; metadata storage rent extra",
  "/tools/revoke-mint":      "Only Solana gas (~0.000005 SOL); no FORGE fee",
  "/tools/revoke-freeze":    "Only Solana gas (~0.000005 SOL); no FORGE fee",
  "/tools/make-immutable":   "Only Solana gas (~0.000005 SOL); no FORGE fee",
  "/tools/market/create":    "Plus protocol deposit required by OpenBook v2",
  "/tools/unit-converter":   "Fully client-side — no transaction, no fee",
  "/tools/sol-converter":    "Fully client-side — no transaction, no fee",
};

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

        {/* ── Tool fees breakdown ── */}
        <div className="tools-fees-section">
          <div className="tools-section-head">
            <h2 className="tools-section-title">Fees breakdown</h2>
            <p className="tools-section-sub">
              All FORGE fees are flat and per-action. Network rent is paid directly to Solana — FORGE never receives it.
            </p>
          </div>
          <div className="pricing-fee-table">
            <div className="pricing-fee-head">
              <span>Tool</span>
              <span>FORGE fee</span>
              <span>Notes</span>
            </div>
            {tools.map((t) => (
              <div key={t.href} className="pricing-fee-row">
                <Link href={t.href} className="pricing-fee-link">{t.name}</Link>
                <span className={`pricing-fee-val${t.fee === "Free" ? " pricing-fee-val--free" : ""}`}>{t.fee}</span>
                <span className="pricing-fee-note">{feeNotes[t.href]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="tools-faq-section">
          <div className="tools-section-head">
            <h2 className="tools-section-title">Frequently asked</h2>
          </div>
          <div className="lp-faq">
            <details className="lp-faq-item">
              <summary>
                <span>Are the free tools really free?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                Yes. Revoke Mint, Revoke Freeze, Make Immutable, and both converter tools have zero FORGE platform fee.
                You only pay the standard Solana network fee (~0.000005 SOL per transaction), which goes directly to validators — not to FORGE.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>What are "pass-through" fees on OpenBook Market?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                Creating an OpenBook order-book market requires a SOL deposit to the OpenBook v2 protocol itself (not to FORGE).
                This deposit covers the on-chain storage for your market accounts and is set by the protocol, not by us.
                FORGE charges 0.05 SOL on top for the creation service.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>What if my transaction fails — am I still charged?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                No. FORGE platform fees are only deducted on a confirmed, successful transaction.
                If your transaction fails or is rejected by the Solana runtime, you are not charged a FORGE fee.
                You may still lose the small Solana gas fee (~0.000005 SOL) consumed by the attempt.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>Is Solana network rent included in quoted fees?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                No. Network rent — the SOL deposited to store account data on-chain — is separate from FORGE fees and goes directly to the Solana network.
                For Multisender, each new recipient token account costs ~0.002 SOL in rent. Existing accounts cost nothing extra.
                The fee table shows FORGE's portion only.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>Can fees change?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                FORGE fees are set in the on-chain program. Any change requires a program upgrade and will be announced
                at least 14 days in advance via our X (Twitter) and Telegram channels before taking effect.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>How much SOL do I need in my wallet?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                For most tool operations, 0.1–0.2 SOL is plenty. For token creation with liquidity on multiple DEXs, budget 0.3–0.5 SOL
                to cover FORGE fees, DEX pool initialization costs, and Solana rent. We recommend keeping at least 0.5 SOL available.
              </div>
            </details>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
