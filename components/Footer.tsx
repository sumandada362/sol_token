import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand">
            <Link href="/" className="site-footer-logo">FORGE</Link>
            <p className="site-footer-tagline">
              Non-custodial. We never hold your keys.<br />
              Tokens are risky — not financial advice.
            </p>
          </div>

          <div className="site-footer-groups">
            <div className="site-footer-group">
              <div className="site-footer-group-title">Product</div>
              <ul>
                <li><Link href="/create">Create Token</Link></li>
                <li><Link href="/pool">Add Liquidity</Link></li>
                <li><Link href="/pool/add">Manage Pool</Link></li>
                <li><Link href="/burn">Burn</Link></li>
                <li><Link href="/tools/multisender">Multisender</Link></li>
                <li><Link href="/dashboard">Analytics</Link></li>
              </ul>
            </div>

            <div className="site-footer-group">
              <div className="site-footer-group-title">Tools</div>
              <ul>
                <li><Link href="/tools/mint-tokens">Mint Tokens</Link></li>
                <li><Link href="/tools/update-metadata">Update Metadata</Link></li>
                <li><Link href="/tools/revoke-mint">Revoke Authorities</Link></li>
                <li><Link href="/tools/market/create">OpenBook Market</Link></li>
                <li><Link href="/tools/unit-converter">SOL Converter</Link></li>
              </ul>
            </div>

            <div className="site-footer-group">
              <div className="site-footer-group-title">Resources</div>
              <ul>
                <li><Link href="/docs">Docs</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/docs/faq">FAQ</Link></li>
                <li><Link href="/explore">Explore</Link></li>
              </ul>
            </div>

            <div className="site-footer-group">
              <div className="site-footer-group-title">Legal</div>
              <ul>
                <li><Link href="/legal/terms">Terms</Link></li>
                <li><Link href="/legal/privacy">Privacy</Link></li>
                <li><Link href="/legal/risk">Risk Disclaimer</Link></li>
              </ul>
            </div>

            <div className="site-footer-group">
              <div className="site-footer-group-title">Social</div>
              <ul>
                <li><a href="#" target="_blank" rel="noopener noreferrer">X (Twitter)</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">Telegram</a></li>
                <li><a href="#" target="_blank" rel="noopener noreferrer">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="site-footer-divider" />

        <div className="site-footer-bottom">
          <p className="site-footer-copy">© 2026 FORGE. All rights reserved.</p>
          <p className="site-footer-disclaimer">
            Non-custodial. We never hold your keys. Tokens are risky — not financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
