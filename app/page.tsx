import type React from "react";
import Link from "next/link";
import CustomizeTokenPanel from "@/components/CustomizeTokenPanel";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        {/* 1) hero text + description */}
        <div id="hero-text">
          <div className="headline">
            Create &amp; Launch Your
            <br />
            <span className="brand-blend">Solana Token</span> in Minutes
          </div>
          <p className="tagline">
            <strong>FORGE</strong> is the fastest and safest way to create and launch
            tokens on Solana Network. No Coding, No Complexity
          </p>
        </div>

        {/* 2) Customize Token form (right on desktop, last on mobile) */}
        <CustomizeTokenPanel />

        {/* 3) CTA button left-aligned, then DEX strip + token logos row */}
        <div id="cta-zone">
          <Link href="/create" className="hero-cta">
            Create &amp; Launch Token
          </Link>

          <div className="hero-strip">
            {/* Left — DEX pool info */}
            <div className="hero-dex">
              <span className="hero-dex-label">Pool your tokens on these DEXes</span>
              <div className="hero-dex-ticker">
                <div className="hero-dex-names">
                  {(["Raydium", "Orca", "Meteora", "PumpSwap", "Invariant", "FluxBeam",
                     "Raydium", "Orca", "Meteora", "PumpSwap", "Invariant", "FluxBeam"]).map((dex, i) => (
                    <span key={i} className="hero-dex-name">{dex}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — successful SPL token coins */}
            <div className="hero-token-logos">
              <span className="hero-tokens-label">Top SPL tokens</span>
              <div className="hero-coins-row">
                {[
                  { symbol: "RAY",  name: "Raydium",    bg: "linear-gradient(135deg,#c93232,#f97316)",  icon: "◈" },
                  { symbol: "JUP",  name: "Jupiter",    bg: "linear-gradient(135deg,#00b4d8,#7209b7)",  icon: "♃" },
                  { symbol: "BONK", name: "Bonk",       bg: "linear-gradient(135deg,#f97316,#fbbf24)",  icon: "◉" },
                  { symbol: "WIF",  name: "dogwifhat",  bg: "linear-gradient(135deg,#845ef7,#e879f9)",  icon: "◎" },
                  { symbol: "PYTH", name: "Pyth",       bg: "linear-gradient(135deg,#5b30f7,#29b6f6)",  icon: "⬡" },
                  { symbol: "ORCA", name: "Orca",       bg: "linear-gradient(135deg,#00c2a8,#0077ff)",  icon: "◐" },
                ].map((t, i) => (
                  <div
                    key={t.symbol}
                    className="hero-token-coin"
                    style={{ background: t.bg, zIndex: 6 - i }}
                    title={`${t.name} (${t.symbol})`}
                  >
                    <span className="hero-coin-icon">{t.icon}</span>
                    <span className="hero-coin-sym">{t.symbol}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="lp">

        {/* ── How it works ── */}
        <section className="lp-section" id="how-it-works">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <p className="lp-eyebrow">How it works</p>
            <h2 className="lp-heading">Launch in 4 steps</h2>
          </div>
          <div className="lp-steps" data-stagger>
            {[
              { n: "1", title: "Connect", body: "Connect your Solana wallet — Phantom, Solflare, or Backpack." },
              { n: "2", title: "Configure", body: "Name your token, set supply, upload branding, and set authorities." },
              { n: "3", title: "Add liquidity", body: "Choose one or more DEXs and set your initial liquidity amounts." },
              { n: "4", title: "Track", body: "Monitor price, volume, holders, and concentration from your dashboard." },
            ].map(({ n, title, body }) => (
              <div key={n} className="lp-step">
                <div className="lp-step-num">{n}</div>
                <div className="lp-step-title">{title}</div>
                <p className="lp-step-body">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Services grid ── */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <p className="lp-eyebrow">Everything you need</p>
            <h2 className="lp-heading">One platform, full lifecycle</h2>
          </div>
          <div className="lp-services" data-stagger>
            <ServiceCard
              href="/create"
              icon="◈"
              title="Create"
              body="Deploy SPL or Token-2022 tokens with custom supply, metadata, and authorities in minutes."
              cta="Create a token"
            />
            <ServiceCard
              href="/pool"
              icon="⇌"
              title="Pool"
              body="Add liquidity to Raydium, Orca, Meteora, PumpSwap, Invariant, or FluxBeam — or all at once."
              cta="Add liquidity"
            />
            <ServiceCard
              href="/burn"
              icon="⊘"
              title="Burn"
              body="Permanently remove tokens from circulation to reduce supply and signal commitment."
              cta="Burn tokens"
            />
            <ServiceCard
              href="/token/example"
              icon="⊕"
              title="Security"
              body="Check mint/freeze authority status, top-holder concentration, and risk flags for any token."
              cta="Check security"
            />
          </div>
        </section>

        {/* ── Why choose us ── */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <p className="lp-eyebrow">Why FORGE</p>
            <h2 className="lp-heading">Built for builders</h2>
          </div>
          <div className="lp-pillars" data-stagger>
            {[
              { icon: "🔑", title: "Non-custodial", body: "We never hold your keys. Every transaction is signed by your wallet alone." },
              { icon: "⚡", title: "Fast", body: "Go from zero to launched in under 2 minutes. No forms, no waiting." },
              { icon: "🔍", title: "Transparent", body: "All fees shown upfront. No hidden surcharges, no surprises." },
              { icon: "🛡", title: "Secure", body: "Authority checker, concentration analysis, and risk flags baked in." },
              { icon: "🌐", title: "Multi-DEX", body: "List on 6 DEXs simultaneously with a single signing flow." },
            ].map(({ icon, title, body }) => (
              <div key={title} className="lp-pillar">
                <div className="lp-pillar-icon">{icon}</div>
                <div className="lp-pillar-title">{title}</div>
                <p className="lp-pillar-body">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Security band ── */}
        <section className="lp-section">
          <div className="lp-grid">
            <div className="lp-copy" data-reveal>
              <p className="lp-eyebrow">Security</p>
              <h2 className="lp-heading">Authority &amp; mint status</h2>
              <p className="lp-body">
                Check whether the mint and freeze authorities are revoked or
                still active. Frozen authorities mean no one can mint new supply
                or freeze holdings — and that matters.
              </p>
              <ul className="lp-flags">
                <li className="lp-flag lp-flag--ok">Mint authority revoked</li>
                <li className="lp-flag lp-flag--ok">Freeze authority revoked</li>
                <li className="lp-flag lp-flag--warn">Update authority active</li>
              </ul>
              <div className="lp-actions">
                <Link href="/token/example" className="lp-btn lp-btn--secondary">Verify a token</Link>
                <a href="#" className="lp-link">View on explorer →</a>
              </div>
            </div>
            <div className="lp-visual" data-reveal style={{ "--delay": "150ms" } as React.CSSProperties}>
              <div className="lp-card">
                <div className="lp-card-row">
                  <span>Mint authority</span>
                  <span className="lp-pill lp-pill--ok">Revoked</span>
                </div>
                <div className="lp-card-row">
                  <span>Freeze authority</span>
                  <span className="lp-pill lp-pill--ok">Revoked</span>
                </div>
                <div className="lp-card-row">
                  <span>Update authority</span>
                  <span className="lp-pill lp-pill--warn">Active</span>
                </div>
                <div className="lp-card-row">
                  <span>Supply</span>
                  <span className="lp-mono">1,000,000,000</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fees ── */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <p className="lp-eyebrow">Fees</p>
            <h2 className="lp-heading">Simple, flat pricing</h2>
            <p className="lp-body lp-body--center">
              One-time per-action charges only. No subscriptions, no hidden costs, no surprises.
            </p>
          </div>
          <div className="lp-fee-table" data-reveal>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Create a token (base)</span>
              <span className="lp-fee-amount">0.1 SOL</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Custom creator info (at creation)</span>
              <span className="lp-fee-amount">0.1 SOL</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Add liquidity (per DEX pool)</span>
              <span className="lp-fee-amount">0.1 SOL</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Multisender (bulk send)</span>
              <span className="lp-fee-amount">0.01 SOL / tx</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Mint more tokens</span>
              <span className="lp-fee-amount">0.1 SOL</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Metadata update / OpenBook market</span>
              <span className="lp-fee-amount">0.05 SOL</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Revoke mint / freeze authority</span>
              <span className="lp-fee-amount">0.05 SOL each</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Freeze / Unfreeze account</span>
              <span className="lp-fee-amount">0.01 SOL / address</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Make immutable, burn, burn LP &amp; converters</span>
              <span className="lp-fee-amount lp-fee-amount--free">Free</span>
            </div>
            <div className="lp-fee-row">
              <span className="lp-fee-label">Hidden fees</span>
              <span className="lp-fee-amount lp-fee-amount--none">None</span>
            </div>
          </div>
          <div className="lp-actions lp-actions--center" style={{ marginTop: "1.5rem" }}>
            <Link href="/tools" className="lp-btn lp-btn--secondary">Full pricing &amp; FAQ →</Link>
          </div>
        </section>

        {/* ── Recent launches ── */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <p className="lp-eyebrow">Recent launches</p>
            <h2 className="lp-heading">Live on Solana</h2>
          </div>
          <div className="lp-token-grid" data-stagger>
            {demoTokens.map((t) => (
              <Link key={t.mint} href={`/token/${t.mint}`} className="lp-token-card">
                <div className="lp-token-avatar">{t.symbol.charAt(0)}</div>
                <div className="lp-token-info">
                  <span className="lp-token-name">{t.name}</span>
                  <span className="lp-token-symbol">{t.symbol}</span>
                </div>
                <div className="lp-token-meta">
                  <span>{t.holders} holders</span>
                  <span>{t.liquidity}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-section">
          <div className="lp-stats" data-reveal>
            <p className="lp-eyebrow">By the numbers</p>
            <h2 className="lp-heading">Trusted by builders across Solana</h2>
            <p className="lp-body lp-body--center">
              From first-time creators to established projects, FORGE keeps token
              launches fast, transparent, and safe.
            </p>
            <div className="lp-stat-grid" data-stagger>
              <Stat value="12k+" label="Tokens launched" />
              <Stat value="6" label="DEXs for liquidity" />
              <Stat value="<2m" label="Average launch time" />
              <Stat value="0" label="Hidden fees" />
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="lp-section">
          <div className="lp-cta" data-reveal="scale">
            <h2 className="lp-heading">Ready to launch?</h2>
            <p className="lp-body lp-body--center">
              Create your token, add liquidity, and start tracking — all from one non-custodial platform.
            </p>
            <div className="lp-actions lp-actions--center">
              <Link href="/create" className="lp-btn lp-btn--primary">Create your token</Link>
              <Link href="/tools" className="lp-btn lp-btn--secondary">Browse tools</Link>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <h2 className="lp-heading">What people say</h2>
            <p className="lp-body">Builders trust FORGE to launch their vision.</p>
          </div>
          <div className="lp-testimonials" data-stagger>
            <Testimonial
              quote="I had my token live in minutes, not days."
              name="Marcus Chen"
              role="Token creator, Solana"
            />
            <Testimonial
              quote="The liquidity setup across multiple DEXs saved me hours of manual work."
              name="Sarah Okonkwo"
              role="Project founder, Web3"
            />
            <Testimonial
              quote="Transparent pricing and no hidden fees. This is how it should be."
              name="James Rivera"
              role="Developer, Blockchain"
            />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center" data-reveal>
            <h2 className="lp-heading">Questions</h2>
            <p className="lp-body">Everything you need to know about FORGE.</p>
          </div>
          <div className="lp-faq" data-stagger>
            <Faq q="Is my token safe?">
              We surface authority status, top-holder concentration, and wallet
              risk indicators. No guarantees exist in crypto, but we show what
              matters so you can decide.
            </Faq>
            <Faq q="How do I add liquidity?">
              Route through Raydium, Orca, Meteora, PumpSwap, Invariant, or
              FluxBeam. Set your amounts and sign — costs are shown upfront.
            </Faq>
            <Faq q="What are risk flags?">
              Red flags include active authorities, extreme holder concentration,
              or suspicious wallet patterns. They&apos;re warnings, not verdicts.
            </Faq>
            <Faq q="Can I burn my holdings?">
              Yes. Use burn to remove tokens from circulation permanently. The
              transaction is irreversible.
            </Faq>
          </div>
          <div className="lp-actions lp-actions--center" style={{ marginTop: "2.5rem" }}>
            <Link href="/docs/faq" className="lp-link">Read the full FAQ →</Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}

/* ── demo data ── */
const demoTokens = [
  { mint: "ABC1", name: "Solana Inu", symbol: "SINU", holders: "1,240", liquidity: "12.4 SOL" },
  { mint: "ABC2", name: "Moon Coin", symbol: "MOON", holders: "876", liquidity: "8.2 SOL" },
  { mint: "ABC3", name: "Forge Token", symbol: "FRGE", holders: "3,201", liquidity: "45.0 SOL" },
  { mint: "ABC4", name: "Wave Protocol", symbol: "WAVE", holders: "540", liquidity: "6.1 SOL" },
];

/* ── presentational helpers ── */

function ServiceCard({ href, icon, title, body, cta }: { href: string; icon: string; title: string; body: string; cta: string }) {
  return (
    <Link href={href} className="lp-service-card">
      <span className="lp-service-icon" aria-hidden>{icon}</span>
      <div className="lp-service-title">{title}</div>
      <p className="lp-service-body">{body}</p>
      <span className="lp-service-cta">{cta} →</span>
    </Link>
  );
}


function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="lp-stat">
      <div className="lp-stat-value">{value}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

function Testimonial({ quote, name, role }: { quote: string; name: string; role: string }) {
  return (
    <figure className="lp-testimonial">
      <div className="lp-stars">★★★★★</div>
      <blockquote>&ldquo;{quote}&rdquo;</blockquote>
      <figcaption>
        <span className="lp-avatar" aria-hidden>{name.charAt(0)}</span>
        <span>
          <span className="lp-testimonial-name">{name}</span>
          <span className="lp-testimonial-role">{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="lp-faq-item">
      <summary>
        {q}
        <span className="lp-faq-icon" aria-hidden>+</span>
      </summary>
      <div className="lp-faq-answer">{children}</div>
    </details>
  );
}
