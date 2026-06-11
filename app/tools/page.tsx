import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import ToolsGrid from "./ToolsGrid";

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
    fee: "0.01 SOL / tx",
    category: "distribution",
  },
  {
    href: "/tools/mint-tokens",
    icon: "⊕",
    name: "Mint Tokens",
    desc: "Increase token supply by minting new tokens to any wallet.",
    fee: "0.1 SOL",
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
    fee: "0.05 SOL",
    category: "authority",
  },
  {
    href: "/tools/revoke-freeze",
    icon: "⊗",
    name: "Revoke Freeze",
    desc: "Remove freeze authority so no wallet can be frozen.",
    fee: "0.05 SOL",
    category: "authority",
  },
  {
    href: "/tools/freeze-account",
    icon: "❄",
    name: "Freeze Account",
    desc: "Freeze token accounts — blocks all transfers for specified wallets.",
    fee: "0.01 SOL / address",
    category: "authority",
  },
  {
    href: "/tools/unfreeze-account",
    icon: "◌",
    name: "Unfreeze Account",
    desc: "Restore transfer ability to frozen token accounts.",
    fee: "0.01 SOL / address",
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
    href: "/tools/burn-lp",
    icon: "⊟",
    name: "Burn LP Tokens",
    desc: "Permanently burn your LP position tokens from a liquidity pool.",
    fee: "Free",
    category: "liquidity",
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
  "/tools/multisender":      "Flat 0.01 SOL per transaction + ~0.002 SOL Solana rent per new account",
  "/tools/mint-tokens":      "Requires active mint authority on the token; inflates supply",
  "/tools/update-metadata":  "Requires update authority; metadata storage rent extra",
  "/tools/revoke-mint":      "0.05 SOL FORGE fee + network gas (~0.000005 SOL)",
  "/tools/revoke-freeze":    "0.05 SOL FORGE fee + network gas (~0.000005 SOL)",
  "/tools/freeze-account":   "0.01 SOL per address frozen; requires active freeze authority",
  "/tools/unfreeze-account": "0.01 SOL per address unfrozen; requires active freeze authority",
  "/tools/make-immutable":   "Only Solana gas (~0.000005 SOL); no FORGE fee",
  "/tools/burn-lp":          "Permanently removes LP position; underlying assets remain in pool",
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
  { id: "liquidity", label: "Liquidity" },
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

        <ToolsGrid tools={tools} categories={categories} />

        <div className="tools-cta lp-card">
          <h2 className="tools-cta-title">Just getting started?</h2>
          <p className="lp-body">Create your token first, then use these tools to manage it.</p>
          <div className="lp-actions">
            <Link href="/create-token" className="lp-btn lp-btn--primary">Create a token</Link>
            <Link href="/docs" className="lp-btn lp-btn--secondary">Read the docs</Link>
          </div>
        </div>

        {/* ── Full fee structure ── */}
        <div className="tools-fees-section">
          <div className="tools-section-head">
            <h2 className="tools-section-title">Complete fee structure</h2>
            <p className="tools-section-sub">
              All FORGE fees are flat and per-action. DEX setup costs and network rent go directly to the DEX / Solana — FORGE never receives them.
            </p>
          </div>
          <div className="pricing-fee-table">
            <div className="pricing-fee-head">
              <span>Action</span>
              <span>FORGE fee</span>
              <span>Notes</span>
            </div>
            {/* Core actions */}
            <div className="pricing-fee-row pricing-fee-row--group">
              <span className="pricing-fee-group-label" style={{ gridColumn: "1/-1" }}>Core actions</span>
            </div>
            <div className="pricing-fee-row">
              <Link href="/create-token" className="pricing-fee-link">Create token</Link>
              <span className="pricing-fee-val">0.1 SOL</span>
              <span className="pricing-fee-note">Metadata, socials, token page. Add-ons: +0.05 SOL revoke mint, +0.05 SOL revoke freeze, +0.1 SOL custom creator info. Make immutable free.</span>
            </div>
            <div className="pricing-fee-row">
              <Link href="/create-token" className="pricing-fee-link">Custom creator info (at creation)</Link>
              <span className="pricing-fee-val">0.1 SOL</span>
              <span className="pricing-fee-note">Embed creator identity on-chain — optional add-on at token creation</span>
            </div>
            <div className="pricing-fee-row">
              <Link href="/pool" className="pricing-fee-link">Create liquidity pool (per DEX)</Link>
              <span className="pricing-fee-val">0.1 SOL</span>
              <span className="pricing-fee-note">+ 0.4–0.6 SOL DEX setup cost paid directly to the DEX</span>
            </div>
            <div className="pricing-fee-row">
              <Link href="/pool/add" className="pricing-fee-link">Add liquidity (existing pool)</Link>
              <span className="pricing-fee-val">0.05 SOL</span>
              <span className="pricing-fee-note">Token/SOL deposit becomes your LP position, not a fee</span>
            </div>
            <div className="pricing-fee-row">
              <Link href="/pool/remove" className="pricing-fee-link">Remove liquidity</Link>
              <span className="pricing-fee-val">0.05 SOL</span>
              <span className="pricing-fee-note">Withdraws your share from the pool</span>
            </div>
            {/* Tools */}
            <div className="pricing-fee-row pricing-fee-row--group">
              <span className="pricing-fee-group-label" style={{ gridColumn: "1/-1" }}>Token tools</span>
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
                <span>What is the full fee structure?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                <strong>Create token:</strong> 0.1 SOL base (metadata, socials, token page) + 0.05 SOL each to revoke mint/freeze at creation + 0.1 SOL custom creator info (optional). Make immutable at creation is free.<br />
                <strong>Create pool (per DEX):</strong> 0.1 SOL FORGE fee + 0.4–0.6 SOL DEX setup (paid to the DEX).<br />
                <strong>Add / Remove liquidity:</strong> 0.05 SOL each.<br />
                <strong>Multisender:</strong> 0.01 SOL flat per transaction.<br />
                <strong>Mint tokens:</strong> 0.1 SOL.<br />
                <strong>Update metadata / OpenBook market:</strong> 0.05 SOL each.<br />
                <strong>Revoke mint authority / Revoke freeze authority:</strong> 0.05 SOL each.<br />
                <strong>Freeze account / Unfreeze account:</strong> 0.01 SOL per address.<br />
                <strong>Burn / Burn LP tokens / Make immutable:</strong> Free.<br />
                Network rent and DEX setup costs are always shown upfront and are separate from FORGE fees.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>What are the DEX pool setup costs (0.4–0.6 SOL)?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                When you create a liquidity pool, the DEX protocol (Raydium, Orca, Meteora, etc.) charges a one-time setup fee
                to initialize the pool accounts on-chain. This ranges from 0.4–0.6 SOL depending on the DEX and goes entirely
                to the DEX protocol — FORGE receives none of it. FORGE charges a separate flat 0.1 SOL per pool for the creation service.
                Both costs are shown upfront in the cost summary before you sign.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>Are the free tools really free?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                Burn, Burn LP tokens, Make Immutable, and both converter tools have zero FORGE platform fee.
                Revoke Mint and Revoke Freeze each cost 0.05 SOL.
                Freeze Account and Unfreeze Account each cost 0.01 SOL per address.
                All transactions also incur the standard Solana network fee (~0.000005 SOL), which goes directly to validators — not to FORGE.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>How does Freeze / Unfreeze Account pricing work?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                Both Freeze Account and Unfreeze Account charge <strong>0.01 SOL per address</strong>.
                If you freeze or unfreeze 10 wallets in one batch, the cost is 10 × 0.01 = 0.10 SOL.
                Both tools require your wallet to hold the freeze authority for the token.
                If you have already revoked freeze authority using Revoke Freeze, these tools cannot be used.
              </div>
            </details>
            <details className="lp-faq-item">
              <summary>
                <span>What are "pass-through" fees on OpenBook Market?</span>
                <span className="lp-faq-icon" aria-hidden>+</span>
              </summary>
              <div className="lp-faq-answer">
                Creating an OpenBook order-book market requires a SOL deposit (~2.85 SOL) to the OpenBook v2 protocol itself (not to FORGE).
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
                For most tool operations, 0.1–0.2 SOL is plenty. To create a token and launch on one DEX, budget around 0.7 SOL
                (0.1 base creation + 0.1 FORGE pool fee + ~0.5 DEX setup + small rent). Add 0.05 SOL per authority you revoke at creation and 0.1 SOL for custom creator info if needed.
                We recommend keeping at least 1 SOL available to cover everything comfortably.
              </div>
            </details>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
