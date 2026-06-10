import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Explore — FORGE",
  description: "Discover recently launched Solana tokens, filter by holders, liquidity, and more.",
};

const tokens = [
  { mint: "ABC1", name: "Solana Inu", symbol: "SINU", holders: 1240, liquidity: "12.4 SOL", age: "2h", hasLiquidity: true },
  { mint: "ABC2", name: "Moon Coin", symbol: "MOON", holders: 876, liquidity: "8.2 SOL", age: "5h", hasLiquidity: true },
  { mint: "ABC3", name: "Forge Token", symbol: "FRGE", holders: 3201, liquidity: "45.0 SOL", age: "1d", hasLiquidity: true },
  { mint: "ABC4", name: "Wave Protocol", symbol: "WAVE", holders: 540, liquidity: "6.1 SOL", age: "3d", hasLiquidity: true },
  { mint: "ABC5", name: "Drift Labs", symbol: "DRFT", holders: 210, liquidity: "—", age: "6h", hasLiquidity: false },
  { mint: "ABC6", name: "Pyth Bird", symbol: "PYRB", holders: 88, liquidity: "—", age: "12h", hasLiquidity: false },
  { mint: "ABC7", name: "Coral Reef", symbol: "CORF", holders: 4520, liquidity: "120.0 SOL", age: "7d", hasLiquidity: true },
  { mint: "ABC8", name: "Sand Dollar", symbol: "SNDL", holders: 320, liquidity: "3.0 SOL", age: "2d", hasLiquidity: true },
];

export default function ExplorePage() {
  return (
    <div className="app-page">
      <div className="page-wrap">
        <div className="page-header">
          <h1 className="page-title">Explore launches</h1>
          <p className="page-sub">Discover tokens created on FORGE.</p>
        </div>

        {/* Filter bar */}
        <div className="explore-filters">
          <button className="filter-chip filter-chip--active">Newest</button>
          <button className="filter-chip">Most holders</button>
          <button className="filter-chip">Has liquidity</button>
        </div>

        {/* Token grid */}
        <div className="explore-grid">
          {tokens.map((t) => (
            <Link key={t.mint} href={`/token/${t.mint}`} className="explore-card">
              <div className="explore-card-avatar">{t.symbol.charAt(0)}</div>
              <div className="explore-card-body">
                <div className="explore-card-top">
                  <span className="explore-card-name">{t.name}</span>
                  <span className="explore-card-symbol">{t.symbol}</span>
                </div>
                <div className="explore-card-meta">
                  <span>{t.holders.toLocaleString()} holders</span>
                  <span>{t.liquidity}</span>
                  <span className="explore-card-age">{t.age} ago</span>
                </div>
                {t.hasLiquidity && <span className="explore-card-badge">Has liquidity</span>}
              </div>
            </Link>
          ))}
        </div>

        <div className="explore-more">
          <button className="lp-btn lp-btn--secondary">Load more</button>
        </div>

        <div className="explore-cta">
          <p className="lp-body lp-body--center">Ready to launch your own?</p>
          <Link href="/create" className="lp-btn lp-btn--primary">Launch your own</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
