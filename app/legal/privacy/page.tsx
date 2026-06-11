import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — FORGE",
  description: "How FORGE collects, uses, and protects your information.",
};

const sections = [
  {
    id: "intro",
    title: "1. Introduction & Scope",
    body: `This Privacy Policy describes how FORGE ("we", "us") collects and uses information when you access the FORGE website and application. By using the Service, you agree to the practices described here.`,
  },
  {
    id: "what-we-collect",
    title: "2. Information We Collect",
    body: `On-chain/wallet data: your public wallet address and transaction data — inherently public on Solana. Usage/technical data: IP address, device and browser type, pages visited, collected via analytics and standard server logs. Voluntarily provided: token metadata, social links, and any information you submit via support channels or newsletters. We do NOT collect or store private keys or seed phrases.`,
  },
  {
    id: "how-we-use",
    title: "3. How We Use Information",
    body: `We use information to: operate and improve the Service; build and broadcast transactions you initiate; provide analytics and display token data; detect fraud and abuse; communicate with you about your account; and comply with legal obligations.`,
  },
  {
    id: "cookies",
    title: "4. Cookies & Tracking",
    body: `We use essential cookies for session management and preference cookies to remember your theme setting. We may use privacy-respecting analytics (no cross-site tracking). You can control cookies via your browser settings.`,
  },
  {
    id: "third-parties",
    title: "5. Third-Party Services & Data Sharing",
    body: `We use third-party RPC and data providers (e.g., Helius, Birdeye), hosting services, and privacy-respecting analytics. We do not sell your personal data. We only share data as needed to operate the Service or when required by law.`,
  },
  {
    id: "on-chain",
    title: "6. On-Chain Data Notice",
    body: `Blockchain data is public, permanent, and outside our control. Your wallet address and all on-chain transactions are visible to anyone and cannot be deleted from the blockchain.`,
  },
  {
    id: "retention",
    title: "7. Data Retention",
    body: `We retain off-chain data (logs, analytics) for as long as necessary to operate the Service, typically no more than 24 months. You may request deletion of off-chain data associated with your email by contacting us.`,
  },
  {
    id: "security",
    title: "8. Security",
    body: `We use industry-standard security measures including encryption in transit (TLS) and access controls. No method of transmission is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    id: "your-rights",
    title: "9. Your Rights",
    body: `Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data. Note that on-chain data cannot be deleted. To exercise your rights, contact us at privacy@[domain]. We will respond within 30 days.`,
  },
  {
    id: "transfers",
    title: "10. International Transfers",
    body: `Your data may be processed in countries outside your own. By using the Service, you consent to this transfer. We apply appropriate safeguards for cross-border transfers.`,
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    body: `The Service is not directed at persons under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided data, contact us and we will delete it.`,
  },
  {
    id: "changes",
    title: "12. Changes to Policy",
    body: `We may update this Privacy Policy. We will notify you of material changes via the Service or by email. Continued use after changes constitutes acceptance.`,
  },
  {
    id: "contact",
    title: "13. Contact",
    body: `For privacy inquiries, contact us at privacy@[domain].`,
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
          <div className="legal-attorney-notice">
            ⚖️ Template only — not legal advice. Requires attorney review before publishing.
          </div>
          <h1 className="docs-article-h1">Privacy Policy</h1>
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
