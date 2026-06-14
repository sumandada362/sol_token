import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { abs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy — Solana Token",
  description:
    "How Solana Token (Dravyo) collects, uses, and protects your information. We are non-custodial — we never hold your private keys or funds.",
  alternates: { canonical: abs("/legal/privacy") },
};

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    body: `As part of our daily business operations, we collect certain information from our users and prospective users to provide them with our web-based service. We are committed to protecting your personal data, and your privacy is of utmost importance to us. This Privacy Policy ("Policy") applies to the processing of personal data by Dravyo ("Company", "we", "us") in connection with the use of our services and your visit to or use of the internet website, the address of which is https://solanatoken.dravyo.com (hereinafter "Website").

Dravyo is a web-based platform whose features include the creation, launching, and management of tokens on the Solana blockchain. This Policy outlines the types of information we may collect from you when you access or use our Website, and our practices for collecting, using, protecting, and disclosing that information. It also informs you of your rights regarding the processing of your personal information. We regularly review this Policy to ensure it aligns with new obligations, technologies, changes in our business operations, and the evolving regulatory environment.

Please note that our Website is not intended for individuals under the age of 18 years, and we do not knowingly collect data related to minors.`,
  },
  {
    id: "data-controller",
    title: "2. Responsibilities and Data Controller",
    body: `Dravyo is responsible for data protection on the Website, unless expressly stated otherwise. You can contact us regarding data protection matters at support@solanatoken.dravyo.com.

To sign and broadcast transactions, we rely on third-party Solana wallet providers — including, but not limited to, Phantom, Solflare, and other Solana-compatible wallets such as those connected via WalletConnect (https://walletconnect.com). These wallets are not operated or controlled by us from a legal or privacy perspective, and we never receive your private keys or seed phrase. All token transactions facilitated through the Website are conducted on the Solana blockchain using the SPL and Token-2022 standards.`,
  },
  {
    id: "security",
    title: "3. How do we protect personal information?",
    body: `We have implemented appropriate technical and organizational security measures to enhance the integrity and security of the personal information we collect and maintain, including encryption in transit (TLS), access controls, and rate limiting. While we take these measures to protect your data, please note that no security measure is foolproof. In the event of a security breach, we will attempt to notify affected users electronically, and we may also post a notice through the Website.`,
  },
  {
    id: "information-collected",
    title: "4. Information we may collect about you",
    body: `Dravyo collects only the information necessary to operate the Website and improve the user experience. The information we may collect, and the purposes for which we use it, includes:

• Wallet address: When you connect your wallet and confirm an action, we record your public Solana wallet address. After a transaction is confirmed on-chain, we store it to journal platform-fee payments, to associate the tokens you create with your wallet, and to display your tokens and holdings. We never collect or store your private keys or seed phrase.

• Token information you provide: Details you enter to create or manage a token, such as its name, symbol, description, logo image, and website, Twitter, or Telegram links. Your logo and a metadata file are uploaded to IPFS through our pinning provider (Pinata) and referenced on-chain. By the nature of IPFS and the blockchain, this information is public and permanent.

• Transaction and technical information: On-chain transaction signatures, fee amounts, token mint addresses, and related network information, used to confirm and journal actions, to enable resumable batch operations (for example, the multisender), and to detect fraud or abuse.

• IP address: We read your IP address from your request solely to apply rate limiting and prevent spam and abuse. It is used transiently for this purpose and is not stored in our token or fee records.

• Communications with support: Information related to your communications with us, collected to respond to your requests and improve the quality of our support.

We do not use your data for advertising or cross-site tracking, and we do not sell your personal data.`,
  },
  {
    id: "disclosure",
    title: "5. Disclosure of your personal information",
    body: `We will not disclose your confidential information to third parties, except in circumstances where required by applicable laws and regulations, or where necessary to operate the Website — for example, RPC and data providers (such as Helius and Birdeye), our IPFS pinning provider, and hosting infrastructure. We do not sell your personal data, and any such disclosures are made on a "need-to-know" basis. Please note that data written to the Solana blockchain or to IPFS is public, permanent, and outside our control, and cannot be deleted.`,
  },
  {
    id: "your-rights",
    title: "6. Your rights regarding your personal information",
    body: `Depending on your jurisdiction, you may have the following rights:

• Access: You can request a copy of the personal information we hold about you.
• Update: You have the right to request updates to your out-of-date or incorrect personal information.
• Delete: You can request the deletion of your personal information in certain specific circumstances. Note that on-chain and IPFS data cannot be deleted.
• Restrict: You can request restrictions on the way we process your personal information in specific circumstances.
• Transfer: You have the right to request the transfer of your personal information to a third-party provider of services.
• Object: You can object to our use of your personal information in certain situations where we process your data based on legitimate interests.

To exercise any of these rights, please contact us at support@solanatoken.dravyo.com. We will respond within 30 days.`,
  },
  {
    id: "cookies",
    title: "7. Cookies",
    body: `Dravyo does not use advertising or cross-site tracking cookies. We may use strictly necessary storage in your browser (such as local storage) to remember interface preferences, for example your theme. Where any cookies or similar tracking technologies are used, they are limited to what is needed to operate the Website. You can control cookies and local storage through your browser settings.`,
  },
  {
    id: "changes",
    title: "8. Changes to the Policy",
    body: `Dravyo reserves the right to modify or replace this Policy at its discretion. In the case of material revisions, we will provide at least 30 days' notice before the new terms take effect. Your continued use of the Website after this notice period constitutes acceptance of the revised Policy.`,
  },
  {
    id: "contact",
    title: "9. Contact",
    body: `If you have questions, need to resolve a complaint regarding the Website, or seek further information about our services, please contact Dravyo via email at support@solanatoken.dravyo.com.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="app-page">
      <div className="legal-layout">
        <nav className="legal-sidebar" data-reveal="fade">
          <div className="legal-sidebar-title">Privacy Policy</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="docs-sidebar-link">{s.title.split(". ")[1]}</a>
          ))}
          <div className="docs-sidebar-divider" />
          <Link href="/legal/terms" className="docs-sidebar-link">Terms of Service</Link>
          <Link href="/legal/risk" className="docs-sidebar-link">Risk Disclaimer</Link>
        </nav>

        <article className="legal-content" data-reveal>
          <h1 className="docs-article-h1">Privacy Policy</h1>
          <p className="legal-date">Last updated: June 14, 2026</p>

          {sections.map((s) => (
            <section key={s.id} id={s.id} className="legal-section">
              <h2 className="docs-article-h2">{s.title}</h2>
              <p className="lp-body" style={{ whiteSpace: "pre-line" }}>{s.body}</p>
            </section>
          ))}
        </article>
      </div>
      <Footer />
    </div>
  );
}
