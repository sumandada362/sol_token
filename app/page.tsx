import Link from "next/link";
import CustomizeTokenPanel from "@/components/CustomizeTokenPanel";

export default function Home() {
  return (
    <>
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

        {/* 3) Create & Launch Token button */}
        <div id="cta-zone">
          <Link href="/create-token" className="hero-cta">
            Create &amp; Launch Token
          </Link>
        </div>
      </section>

      {/*
        Everything below the hero sits in the background-less content layer
        (#content, z-index: 1), so the fixed accretion-disc canvas (z-index: -1)
        stays visible behind every section — sections use glass surfaces only.
      */}
      <div className="lp">
        {/* ── Security ── */}
        <section className="lp-section">
          <div className="lp-grid">
            <div className="lp-copy">
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
                <a href="#" className="lp-btn lp-btn--secondary">Verify</a>
                <a href="#" className="lp-link">View on explorer →</a>
              </div>
            </div>
            <div className="lp-visual">
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

        {/* ── Holders ── */}
        <section className="lp-section">
          <div className="lp-grid lp-grid--reverse">
            <div className="lp-visual">
              <div className="lp-card">
                <div className="lp-card-title">Top holder concentration</div>
                <Bar label="Top wallet" value={12} />
                <Bar label="Top 10 wallets" value={38} />
                <Bar label="Liquidity pool" value={22} />
                <Bar label="Circulating" value={28} />
              </div>
            </div>
            <div className="lp-copy">
              <p className="lp-eyebrow">Holders</p>
              <h2 className="lp-heading">Who owns what &amp; concentration risk</h2>
              <p className="lp-body">
                See how supply is distributed across wallets. High concentration
                means fewer hands control the token — we surface it so you can
                decide.
              </p>
              <ul className="lp-checklist">
                <li>Top holder owns 12% of supply</li>
                <li>Top ten holders own 38% of supply</li>
                <li>Concentration risk flagged above threshold</li>
              </ul>
              <div className="lp-actions">
                <a href="#" className="lp-btn lp-btn--secondary">Check holders</a>
                <a href="#" className="lp-link">Full breakdown →</a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="lp-section">
          <div className="lp-stats">
            <p className="lp-eyebrow">By the numbers</p>
            <h2 className="lp-heading">Trusted by builders across Solana</h2>
            <p className="lp-body lp-body--center">
              From first-time creators to established projects, FORGE keeps token
              launches fast, transparent, and safe.
            </p>
            <div className="lp-stat-grid">
              <Stat value="12k+" label="Tokens launched" />
              <Stat value="6" label="DEXs for liquidity" />
              <Stat value="<2m" label="Average launch time" />
              <Stat value="0" label="Hidden fees" />
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-section">
          <div className="lp-cta">
            <h2 className="lp-heading">Take action now</h2>
            <p className="lp-body lp-body--center">
              Manage liquidity, burn holdings, or unlock deep analytics for your
              token — all from one place.
            </p>
            <div className="lp-actions lp-actions--center">
              <a href="#" className="lp-btn lp-btn--primary">Add liquidity</a>
              <a href="#" className="lp-btn lp-btn--secondary">Burn supply</a>
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="lp-section">
          <div className="lp-section-head">
            <h2 className="lp-heading">What people say</h2>
            <p className="lp-body">Builders trust FORGE to launch their vision.</p>
          </div>
          <div className="lp-testimonials">
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

        {/* ── FAQ ── (native <details> — no client JS needed) */}
        <section className="lp-section">
          <div className="lp-section-head lp-section-head--center">
            <h2 className="lp-heading">Questions</h2>
            <p className="lp-body">
              Everything you need to know about your token and FORGE.
            </p>
          </div>
          <div className="lp-faq">
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
            <Faq q="What is analytics?">
              Unlock deep metrics on price, volume, liquidity, and holder trends
              over time for 0.5 SOL per year.
            </Faq>
          </div>
        </section>

        {/* ── Contact ── */}
        <section className="lp-section">
          <div className="lp-grid lp-grid--contact">
            <div className="lp-copy">
              <p className="lp-eyebrow">Support</p>
              <h2 className="lp-heading">Found an issue?</h2>
              <p className="lp-body">Report a problem or request assistance.</p>
              <ul className="lp-contact-list">
                <li>
                  <IconMail /> hello@forge.io
                </li>
                <li>
                  <IconPhone /> +1 (555) 000-0000
                </li>
                <li>
                  <IconPin /> 123 Sample St, Sydney NSW 2000 AU
                </li>
              </ul>
            </div>
            <form className="lp-form" action="#">
              <div className="lp-form-row">
                <label>
                  First name
                  <input type="text" name="firstName" />
                </label>
                <label>
                  Last name
                  <input type="text" name="lastName" />
                </label>
              </div>
              <div className="lp-form-row">
                <label>
                  Email
                  <input type="email" name="email" />
                </label>
                <label>
                  Phone
                  <input type="text" name="phone" />
                </label>
              </div>
              <label>
                Message
                <textarea name="message" placeholder="Tell us what happened…" />
              </label>
              <label className="lp-checkbox">
                <input type="checkbox" name="terms" /> I agree to the terms
              </label>
              <button type="submit" className="lp-btn lp-btn--primary">Send</button>
            </form>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <Link href="/" className="lp-footer-logo">VAJRA</Link>
            <ul className="lp-footer-links">
              <li><Link href="/create-token">Create token</Link></li>
              <li><a href="#">Explore tokens</a></li>
              <li><a href="#">Add liquidity</a></li>
              <li><a href="#">View analytics</a></li>
              <li><a href="#">Burn holdings</a></li>
            </ul>
            <div className="lp-footer-social">
              <a href="#" aria-label="X">𝕏</a>
              <a href="#" aria-label="Discord">◇</a>
              <a href="#" aria-label="Telegram">✈</a>
              <a href="#" aria-label="GitHub">⌥</a>
            </div>
          </div>
          <div className="lp-footer-divider" />
          <p className="lp-footer-copy">© 2026 FORGE. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}

/* ── small presentational helpers ── */

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="lp-bar">
      <div className="lp-bar-head">
        <span>{label}</span>
        <span className="lp-mono">{value}%</span>
      </div>
      <div className="lp-bar-track">
        <div className="lp-bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
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

function Testimonial({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
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

/* ── inline icons (no icon library in this project) ── */

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
