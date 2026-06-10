import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Account — FORGE",
  description: "Manage your wallet, subscriptions, and preferences.",
};

const subscriptions = [
  { token: "FRGE", name: "Forge Token", expires: "2027-06-10", active: true },
];

const history = [
  { type: "Token creation", amount: "0.102 SOL", date: "2026-06-08", tx: "sig1ABC" },
  { type: "Liquidity (Raydium)", amount: "0.40 SOL", date: "2026-06-08", tx: "sig2DEF" },
  { type: "Analytics subscription", amount: "1 SOL", date: "2026-06-08", tx: "sig3GHI" },
];

export default function AccountPage() {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="page-header">
          <h1 className="page-title">Account</h1>
        </div>

        {/* Wallet panel */}
        <div className="lp-card account-wallet">
          <div className="account-section-title">Connected wallet</div>
          <div className="account-wallet-row">
            <div className="wallet-chip-dot" style={{ width: 10, height: 10 }} />
            <span className="lp-mono">7xKq3fBnFullAddress1234567890ABCD</span>
          </div>
          <div className="account-wallet-actions">
            <button className="lp-btn lp-btn--secondary">Copy address</button>
            <button className="lp-btn lp-btn--secondary">Change wallet</button>
            <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="lp-link">View on Solscan →</a>
          </div>
          <div className="network-indicator">
            <span className="wallet-chip-net-dot" />
            Mainnet
          </div>
        </div>

        {/* Subscriptions */}
        <div className="dash-section">
          <h2 className="dash-section-title">Analytics subscriptions</h2>
          {subscriptions.length === 0 ? (
            <div className="lp-card dash-empty">
              <p>No active subscriptions.</p>
              <Link href="/explore" className="lp-link">Browse tokens →</Link>
            </div>
          ) : (
            <div className="lp-card">
              {subscriptions.map((s) => (
                <div key={s.token} className="account-sub-row">
                  <div>
                    <span className="account-sub-name">{s.name}</span>
                    <span className="lp-mono account-sub-sym"> ({s.token})</span>
                  </div>
                  <div className="account-sub-expiry">Expires {s.expires}</div>
                  <div className="account-sub-actions">
                    <button className="lp-btn lp-btn--secondary">Renew</button>
                    <button className="lp-btn lp-btn--secondary">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fee history */}
        <div className="dash-section">
          <h2 className="dash-section-title">Fee & transaction history</h2>
          <div className="lp-card analytics-tx-table">
            <div className="analytics-tx-head">
              <span>Type</span><span>Amount</span><span>Date</span><span>Tx</span>
            </div>
            {history.map((h) => (
              <div key={h.tx} className="analytics-tx-row">
                <span>{h.type}</span>
                <span className="lp-mono">{h.amount}</span>
                <span>{h.date}</span>
                <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="lp-link">Solscan ↗</a>
              </div>
            ))}
          </div>
        </div>

        {/* Preferences */}
        <div className="lp-card account-prefs">
          <div className="account-section-title">Preferences</div>
          <div className="account-pref-row">
            <span>Theme</span>
            <div className="wizard-seg">
              <button className="active">Dark</button>
              <button>Light</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <button className="lp-btn lp-btn--secondary">Disconnect wallet</button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
