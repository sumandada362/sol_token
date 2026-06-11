import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — FORGE",
  description: "FORGE Terms of Service.",
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: `By accessing or using FORGE, you agree to be bound by these Terms of Service. You represent that you are of legal age and capacity to enter into a binding agreement, and that you are not located in a jurisdiction where use of the Service is prohibited. If you do not agree, do not use the Service.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    body: `FORGE is a non-custodial interface that enables users to: create SPL and Token-2022 tokens on Solana; create liquidity pools on third-party decentralized exchanges; and burn token holdings. FORGE does not custody funds or private keys, does not control the Solana network or any third-party DEX, and does not issue, endorse, or guarantee any token created through the Service.`,
  },
  {
    id: "non-custodial",
    title: "3. Non-Custodial Nature & Wallets",
    body: `You are solely responsible for your wallet, private keys, seed phrases, and transaction approvals. FORGE never receives, holds, or transmits your private keys or funds. All transactions are initiated and signed by you. Lost keys cannot be recovered by FORGE.`,
  },
  {
    id: "fees",
    title: "4. Fees",
    body: `FORGE charges the following platform fees: 0.1 SOL to create a token; 0.1 SOL per liquidity pool; 0.1 SOL to mint additional tokens; 0.05 SOL to revoke mint authority; 0.05 SOL to revoke freeze authority; 0.01 SOL per address to freeze or unfreeze a token account. Burn, Burn LP tokens, and Make Immutable carry no FORGE fee. All fees are charged on-chain at the time of signing and are non-refundable once confirmed. Network rent and DEX setup costs are pass-through costs separate from platform fees. Fees are subject to change with notice.`,
  },
  {
    id: "user-responsibilities",
    title: "5. User Responsibilities & Acceptable Use",
    body: `You agree to provide accurate token information and not use the Service to create tokens that violate applicable laws or misrepresent their nature. You will not use the Service to create securities or financial instruments without full regulatory compliance.`,
  },
  {
    id: "prohibited",
    title: "6. Prohibited Activities",
    body: `You must not use FORGE to: engage in fraud, rug pulls, or market manipulation; conduct money laundering or violate sanctions laws; impersonate any person or project; create tokens that infringe intellectual property or violate any law; scrape or abuse the platform's infrastructure.`,
  },
  {
    id: "third-party",
    title: "7. Third-Party Services",
    body: `DEXs (Raydium, Orca, Meteora, PumpSwap, Invariant, FluxBeam), wallet providers, RPC/data providers, and blockchain explorers are independent third parties. FORGE is not responsible for their performance, availability, fees, or any losses arising from their use.`,
  },
  {
    id: "no-advice",
    title: "8. No Financial, Legal, or Tax Advice",
    body: `Nothing on FORGE constitutes financial, investment, legal, or tax advice. Analytics data is informational and may be inaccurate or delayed. Always consult qualified professionals before making financial decisions.`,
  },
  {
    id: "ip",
    title: "9. Intellectual Property",
    body: `FORGE's brand, interface, and content are owned by [Entity Name]. You are granted a limited, revocable license to use the Service. You retain rights to content you upload but grant FORGE a license to display it within the Service.`,
  },
  {
    id: "disclaimer",
    title: "10. Disclaimers of Warranty",
    body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. FORGE DOES NOT WARRANT UPTIME, ACCURACY, FITNESS FOR ANY PURPOSE, OR THAT TRANSACTIONS WILL SUCCEED.`,
  },
  {
    id: "risk",
    title: "11. Assumption of Risk",
    body: `You acknowledge the risks inherent in blockchain-based services, including volatility, smart-contract risk, and total loss of funds. See the Risk Disclaimer for full details. By using the Service, you accept all such risks.`,
  },
  {
    id: "liability",
    title: "12. Limitation of Liability",
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, FORGE IS NOT LIABLE FOR INDIRECT, CONSEQUENTIAL, SPECIAL, OR INCIDENTAL DAMAGES, LOST PROFITS, OR LOSSES ARISING FROM BLOCKCHAIN OR THIRD-PARTY FAILURES. FORGE'S AGGREGATE LIABILITY IS LIMITED TO THE FEES YOU PAID IN THE PRECEDING THREE MONTHS.`,
  },
  {
    id: "indemnification",
    title: "13. Indemnification",
    body: `You agree to indemnify and hold harmless FORGE and its affiliates from any claims, damages, or expenses (including attorneys' fees) arising from your use of the Service, your tokens, or your violation of these Terms.`,
  },
  {
    id: "termination",
    title: "14. Termination",
    body: `FORGE may suspend or limit your access for violations of these Terms. Because the Service is non-custodial, termination of your account does not affect your on-chain assets, which remain under your wallet's control.`,
  },
  {
    id: "governing-law",
    title: "15. Governing Law & Dispute Resolution",
    body: `These Terms are governed by the laws of [Jurisdiction]. Any disputes shall be resolved by binding arbitration on an individual basis. Class actions are waived to the extent permitted by law.`,
  },
  {
    id: "changes",
    title: "16. Changes to Terms",
    body: `We may update these Terms. Continued use after changes take effect constitutes acceptance. Material changes will be announced in advance.`,
  },
  {
    id: "contact",
    title: "17. Contact",
    body: `For legal inquiries, contact us at legal@[domain].`,
  },
];

export default function TermsPage() {
  return (
    <div className="app-page">
      <div className="legal-layout">
        <nav className="legal-sidebar">
          <div className="legal-sidebar-title">Terms of Service</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="docs-sidebar-link">{s.title.split(". ")[1]}</a>
          ))}
          <div className="docs-sidebar-divider" />
          <Link href="/legal/privacy" className="docs-sidebar-link">Privacy Policy</Link>
          <Link href="/legal/risk" className="docs-sidebar-link">Risk Disclaimer</Link>
        </nav>

        <article className="legal-content">
          <div className="legal-attorney-notice">
            ⚖️ Template only — not legal advice. Requires attorney review before publishing.
          </div>
          <h1 className="docs-article-h1">Terms of Service</h1>
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
