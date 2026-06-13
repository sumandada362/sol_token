import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Risk Disclaimer — Solana Token",
  description: "Important risk information for using Solana Token to create and trade Solana tokens.",
};

const sections = [
  {
    id: "high-risk",
    title: "1. High-Risk Activity",
    body: `Creating, trading, and providing liquidity for tokens is an extremely high-risk activity. You may lose all funds you invest or commit to any token or liquidity pool. Only use funds you can afford to lose entirely.`,
  },
  {
    id: "no-guarantees",
    title: "2. No Guarantees",
    body: `Solana Token does not guarantee any token's value, liquidity, trading success, or safety. Creating a token through Solana Token does not make that token valuable, legitimate, or tradeable. Token value is determined entirely by market demand, which can be zero.`,
  },
  {
    id: "volatility",
    title: "3. Volatility",
    body: `Token prices are highly volatile and can change dramatically or go to zero within seconds, hours, or days. Past performance of any token is not indicative of future results.`,
  },
  {
    id: "irreversibility",
    title: "4. Irreversibility",
    body: `All on-chain actions — including minting tokens, creating pools, burning tokens, and paying fees — are permanent and cannot be reversed. Burned tokens are destroyed forever. Fees paid are non-refundable. Once a transaction is confirmed on Solana, it cannot be undone.`,
  },
  {
    id: "smart-contract",
    title: "5. Smart Contract & Protocol Risk",
    body: `Third-party DEXs (Raydium, Orca, Meteora, PumpSwap, Invariant, FluxBeam) and the Solana network operate on smart contracts that may contain bugs, exploits, or be changed or shut down without notice. Solana Token does not control these protocols and is not responsible for any losses resulting from their operation or failure.`,
  },
  {
    id: "scams",
    title: "6. Scams & Due Diligence",
    body: `The majority of tokens created on any platform are scams, rug pulls, or projects that fail. Solana Token's security checker (authority badges, concentration analysis) provides informational signals only — it is not a guarantee of safety or legitimacy. Always do your own research before buying, holding, or providing liquidity for any token.`,
  },
  {
    id: "no-advice",
    title: "7. No Advice",
    body: `Nothing on Solana Token — including token data, analytics, security indicators, or any written content — constitutes financial, investment, legal, tax, or professional advice of any kind. Consult qualified professionals before making any financial decision.`,
  },
  {
    id: "regulatory",
    title: "8. Regulatory Risk",
    body: `Laws governing tokens, cryptocurrencies, and digital assets vary by jurisdiction and are rapidly evolving. Tokens may be classified as securities or regulated instruments in your jurisdiction. You are solely responsible for ensuring your use of Solana Token and any tokens you create or trade comply with all applicable laws. Solana Token makes no representation as to the legal status of any token in any jurisdiction.`,
  },
  {
    id: "your-responsibility",
    title: "9. Your Responsibility",
    body: `You alone control your wallet, your private keys, and your decisions. Solana Token is a non-custodial tool — we cannot access your funds, reverse transactions, or assist you if you lose access to your wallet. You bear full responsibility for all actions taken through your wallet.`,
  },
  {
    id: "acknowledgment",
    title: "10. Acknowledgment",
    body: `By using Solana Token, you acknowledge that you have read, understood, and accepted all of the risks described in this disclaimer. You confirm that you are using the Service voluntarily, with full awareness of the risks involved.`,
  },
];

export default function RiskPage() {
  return (
    <div className="app-page">
      <div className="legal-layout">
        <nav className="legal-sidebar" data-reveal="fade">
          <div className="legal-sidebar-title">Risk Disclaimer</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="docs-sidebar-link">{s.title.split(". ")[1]}</a>
          ))}
          <div className="docs-sidebar-divider" />
          <Link href="/legal/terms" className="docs-sidebar-link">Terms of Service</Link>
          <Link href="/legal/privacy" className="docs-sidebar-link">Privacy Policy</Link>
        </nav>

        <article className="legal-content" data-reveal>
          <div className="legal-risk-notice">
            ⚠ This disclaimer contains important risk information. Please read it carefully before using Solana Token.
          </div>
          <div className="legal-attorney-notice">
            ⚖️ Template only — not legal advice. Requires attorney review before publishing.
          </div>
          <h1 className="docs-article-h1">Risk Disclaimer</h1>
          <p className="legal-date">Last updated: [Date]</p>

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="legal-section">
              <h2 className="docs-article-h2">{s.title}</h2>
              <p className="lp-body">{s.body}</p>
            </section>
          ))}
        </article>
      </div>
      <Footer />
    </div>
  );
}
