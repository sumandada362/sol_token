import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export async function generateMetadata({ params }: { params: Promise<{ mint: string }> }): Promise<Metadata> {
  const { mint } = await params;
  return { title: `Analytics — ${mint} — FORGE` };
}

export default async function AnalyticsPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  const subscribed = true;

  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-sub lp-mono">{mint}</p>
          </div>
          <div className="analytics-header-actions">
            <div className="analytics-range-tabs">
              {["7D", "30D", "90D", "1Y", "All"].map((r) => (
                <button key={r} className={`token-chart-tab ${r === "30D" ? "active" : ""}`}>{r}</button>
              ))}
            </div>
            <button className="lp-btn lp-btn--secondary">Export CSV</button>
          </div>
        </div>

        {subscribed ? (
          <>
            {/* Chart cards */}
            <div className="analytics-grid">
              {[
                { title: "Price", color: "#845ef7" },
                { title: "Volume", color: "#29b6f6" },
                { title: "Liquidity / TVL", color: "#3ddc97" },
                { title: "Holder growth", color: "#ffb84d" },
              ].map(({ title }) => (
                <div key={title} className="lp-card analytics-chart-card">
                  <div className="analytics-chart-title">{title}</div>
                  <div className="analytics-chart-placeholder">Chart data — connect live feed</div>
                </div>
              ))}
            </div>

            {/* Buy/sell ratio */}
            <div className="lp-card analytics-buysell">
              <div className="analytics-chart-title">Buy / Sell ratio</div>
              <div className="buysell-bar-wrap">
                <div className="buysell-bar-fill" style={{ width: "62%" }} />
              </div>
              <div className="buysell-labels">
                <span className="buysell-buy">Buy 62%</span>
                <span className="buysell-sell">Sell 38%</span>
              </div>
            </div>

            {/* Transactions table */}
            <div className="dash-section">
              <h2 className="dash-section-title">Recent transactions</h2>
              <div className="lp-card analytics-tx-table">
                <div className="analytics-tx-head">
                  <span>Type</span><span>Amount</span><span>Price</span><span>Time</span><span>Tx</span>
                </div>
                {[
                  { type: "Buy", amount: "250,000 FRGE", price: "$0.0042", time: "2m ago" },
                  { type: "Sell", amount: "50,000 FRGE", price: "$0.0041", time: "7m ago" },
                  { type: "Buy", amount: "1,000,000 FRGE", price: "$0.0040", time: "15m ago" },
                ].map((tx, i) => (
                  <div key={i} className="analytics-tx-row">
                    <span className={`buysell-badge buysell-badge--${tx.type.toLowerCase()}`}>{tx.type}</span>
                    <span className="lp-mono">{tx.amount}</span>
                    <span className="lp-mono">{tx.price}</span>
                    <span>{tx.time}</span>
                    <a href="https://solscan.io" target="_blank" rel="noopener noreferrer" className="lp-link">Solscan ↗</a>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="lp-card analytics-alerts">
              <div className="analytics-chart-title">Alerts</div>
              <div className="alert-row">
                <span>Price drops below</span>
                <input className="wizard-input alert-input" type="number" placeholder="0.003" />
                <span>USD</span>
                <button className="lp-btn lp-btn--secondary alert-save-btn">Save</button>
              </div>
              <Link href="/account" className="lp-link" style={{ display: "block", marginTop: "1rem" }}>Manage subscription →</Link>
            </div>
          </>
        ) : (
          <div className="analytics-upsell lp-card">
            <h2 className="analytics-upsell-title">Unlock full analytics</h2>
            <p className="lp-body">Get price, volume, liquidity history, holder growth, and configurable alerts for this token.</p>
            <div className="cost-summary" style={{ maxWidth: "360px", margin: "1.5rem 0" }}>
              <div className="cost-row"><span>Analytics subscription</span><span className="lp-mono">1 SOL / year</span></div>
            </div>
            <button className="lp-btn lp-btn--primary">Unlock full history — 1 SOL/yr</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
