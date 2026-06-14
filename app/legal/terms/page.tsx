import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { abs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service — Solana Token",
  description:
    "Terms of Service for Solana Token (Dravyo) — the non-custodial toolkit to create and manage Solana tokens. Your rights and obligations when using the platform.",
  alternates: { canonical: abs("/legal/terms") },
};

const sections = [
  {
    id: "general",
    title: "1. General Information",
    body: `These Terms of Service ("Terms") govern the access and use of the internet website, the address of which is https://solanatoken.dravyo.com (hereinafter "Website"), including the software and tools provided through it. For more information about us as the provider of the services (hereinafter "we", "us", or "Dravyo"), please refer to the Website.

The subject matter of these Terms is the regulation of the rights and obligations of the users of the Website. Dravyo is a web-based platform offering a range of features, one of which is the creation, launching, and management of personalized tokens on the Solana blockchain. This feature includes, among others, creating SPL and Token-2022 tokens, creating liquidity pools on third-party decentralized exchanges, minting additional supply, burning tokens, and revoking mint, freeze, or update authorities. You may need to connect your wallet to the Website to access some or all of the services.

Dravyo operates as an interface on the Solana blockchain and distinguishes itself from a trader, contractor, broker, seller, financial institution, or credit provider. The software facilitates the creation of tokens and related on-chain actions through smart contracts and Solana programs. Dravyo does not store, send, or receive digital assets, private keys, or digital goods.

Each time the user accesses the Website, the user irrevocably agrees to comply with these Terms posted on this Website. If the user does not agree to any of the provisions set out in these Terms, the user should not use the Website.`,
  },
  {
    id: "acknowledgements",
    title: "2. User Acknowledgements",
    body: `All token transactions facilitated through Dravyo are conducted on the Solana blockchain using the SPL and Token-2022 standards. Dravyo is not affiliated with the Solana Foundation or Solana Labs and cannot guarantee the availability, security, or proper functioning of the Solana blockchain for every individual transaction. This limitation specifically includes situations where a third party gains unauthorized access to any and all transactions, assets, or files.

In addition, all transactions resulting in token creation or management are based on smart contracts, Solana programs, and blockchain technology, which may contain inherent technology and speculation risks. Users acknowledge and agree to these risks.

The user understands that Dravyo does not own or control any third-party site, product, or service that they might access, visit, or use outside of Dravyo, including decentralized exchanges, wallet providers, RPC or data providers, and blockchain explorers. Dravyo will not be liable for the acts or omissions of any such third parties, nor will it be liable for any damage that users may suffer because of their transactions or any other interaction with any such third parties.`,
  },
  {
    id: "eligibility",
    title: "3. Eligibility",
    body: `To access or use Dravyo, you represent that you are at least the age of majority in your jurisdiction. You further represent that your access and use of Dravyo will fully comply with all applicable laws and regulations and that you will not access or use Dravyo to conduct, promote, or otherwise facilitate any illegal activity, including fraud, market manipulation, money laundering, or the creation of tokens that misrepresent their nature. Furthermore, you represent that neither you nor any entity you represent are included in any trade embargoes or sanctions list, nor are you a resident, citizen, national, or agent of, or an entity organized, incorporated, or doing business in, any such territories.`,
  },
  {
    id: "disclaimer",
    title: "4. Disclaimer",
    body: `All materials on the Dravyo Website are for informational purposes only. Dravyo and its affiliates do not provide legal, fiscal, trading, economic, financial, or any other kind of advice or recommendation that may be relied upon. The information from the Website cannot be used as the basis for an investment strategy, and Dravyo makes no guarantee that it contains no errors, mistakes, misrepresentations, or failures. Tokens are created solely at the direction of the user, and Dravyo does not issue, endorse, audit, or guarantee any token created through the Service. Users will act at their own risk in accessing or relying on the content of the Website and are solely responsible for any consequences thereof.`,
  },
  {
    id: "proprietary-rights",
    title: "5. Proprietary Rights",
    body: `Dravyo owns the intellectual property generated by its contributors, including but not limited to software, text, designs, images, and copyrights. Unless otherwise stated, Dravyo reserves exclusive rights to its intellectual property, and no part of the Website, services, or content indicated therein may be copied, reproduced, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, or distributed in any way to any other computer, server, website, or other medium for publication or distribution for any commercial purpose, without Dravyo's express prior written consent. You retain rights to the content you upload but grant Dravyo a license to display it within the Service.`,
  },
  {
    id: "violation",
    title: "6. Violation of the Terms",
    body: `Dravyo may disclose any information it has about the user if it determines that such disclosure is necessary in connection with any investigation or complaint regarding the use of the Website, or to identify, contact, or bring legal action against someone who may be causing injury to or interference with Dravyo's rights or property. Dravyo may also disclose such information when applicable law requires or permits such disclosure, including exchanging information with other companies and organizations for fraud protection purposes. If Dravyo takes legal action against the user as a result of their violation of these Terms, Dravyo will be entitled to recover all reasonable fees and costs of such action.`,
  },
  {
    id: "changes",
    title: "7. Changes to the Terms",
    body: `Dravyo reserves the right, at its sole discretion, to modify or replace these Terms at any time. If a revision is material, Dravyo will provide at least 30 days' notice prior to any new terms taking effect. The continued use of the Website after the end of the notification period will constitute an acceptance of the revised Terms. What constitutes a material change is determined at Dravyo's sole discretion.`,
  },
  {
    id: "contact",
    title: "8. Contact",
    body: `To address a question, resolve a complaint regarding the Website, or receive further information regarding the services, please contact Dravyo via email at support@solanatoken.dravyo.com.`,
  },
];

export default function TermsPage() {
  return (
    <div className="app-page">
      <div className="legal-layout">
        <nav className="legal-sidebar" data-reveal="fade">
          <div className="legal-sidebar-title">Terms of Service</div>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="docs-sidebar-link">{s.title.split(". ")[1]}</a>
          ))}
          <div className="docs-sidebar-divider" />
          <Link href="/legal/privacy" className="docs-sidebar-link">Privacy Policy</Link>
          <Link href="/legal/risk" className="docs-sidebar-link">Risk Disclaimer</Link>
        </nav>

        <article className="legal-content" data-reveal>
          <h1 className="docs-article-h1">Terms of Service</h1>
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
