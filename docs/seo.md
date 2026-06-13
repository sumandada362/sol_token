# SEO & AI‑Discoverability — what's done and what *you* must do to rank

Honest framing: the code is now **technically best‑in‑class** for SEO and AI answer
engines. But **on‑page SEO alone does not rank a brand‑new domain #1** — Google
ranks on authority (backlinks), relevance, and trust built over time. The
technical work below is necessary but not sufficient. The "Off‑page" section is
what actually moves you up, and it's mostly not code.

---

## 1. What's implemented in the app (done)

**Crawlability**
- `robots.ts` now **allows all content + tool pages** (previously it blocked `/tools`, `/create-token`, `/burn`, `/pool` — the exact pages you need indexed). Only `/api/` and `/og` are disallowed.
- `sitemap.xml` lists every page with priorities (conversion pages 0.95), env‑driven domain, real `lastmod` for posts.

**Per‑page metadata (unique title, description, keywords, canonical, OG/Twitter)**
- Every tool page now has its own keyword‑targeted `<title>`/description via a `layout.tsx` (they were previously inheriting one generic title). Helper: `lib/seo.ts` → `pageMeta()`.
- Canonicals + OG URLs are **env‑driven** (`NEXT_PUBLIC_APP_URL`), so they match your real domain automatically.
- Dynamic OG share images per page via `/og?title=…`.

**Structured data (JSON‑LD) — this is what wins AI answers & rich results**
- Site‑wide: `Organization` + `WebSite` (with Sitelinks SearchAction).
- Home: `SoftwareApplication` + `FAQPage` (matches the visible FAQ).
- Every tool page: `BreadcrumbList` + `HowTo`.
- Blog posts: `BlogPosting` + `FAQPage` + `og:type=article` with dates.
- Docs/blog already render breadcrumbs.

**AI answer engines (ChatGPT, Perplexity, Google AI Overviews)**
- `/llms.txt` — concise, machine‑readable summary of what the app does, the tools, fees, and key facts. AI crawlers increasingly read this.
- Rich `HowTo`/`FAQ` schema is the single biggest lever for being *quoted* in AI answers — keep FAQs factual and specific.

**Thin‑content protection**
- `/token/[mint]` pages are `noindex, follow` (unbounded programmatic pages would dilute site quality).

---

## 2. You must configure these (5 minutes, required)

1. **Set `NEXT_PUBLIC_APP_URL` to your real https domain** in `.env.local` and **rebuild** (`./scripts/deploy.sh`). All canonicals, sitemap, OG, robots `Host`, and `llms.txt` derive from it. If this is wrong, Google sees the wrong domain.
2. **Google Search Console** (https://search.google.com/search-console): add your domain, verify (DNS TXT), and **submit `/sitemap.xml`**. Then "Request indexing" for `/`, `/create-token`, and your top 3 tool pages.
3. **Bing Webmaster Tools** — same; Bing also feeds ChatGPT/Copilot search.
4. **Fill the social links** in `components/JsonLd.tsx` (`sameAs: []`) and the footer (currently `#`) — X, Telegram, GitHub. Real socials add entity trust.
5. **Plausible/GA4** analytics so you can see which keywords convert.

---

## 3. Off‑page — what actually ranks you (the real work)

Ranking #1 for "create solana token" means beating established tools with high
domain authority. That takes **backlinks + brand signals + freshness**:

- **Backlinks (highest impact):** get listed on Solana ecosystem directories, "Solana tools" lists, awesome‑solana repos; write guest posts; answer on StackExchange/Reddit/Solana StackOverflow with a helpful link; submit to ProductHunt, Alternativeto, and tool aggregators.
- **Brand search:** drive people to search your name (X, Telegram, communities). Branded search volume is a strong ranking signal.
- **Content velocity:** the blog already targets long‑tail ("how to revoke mint authority", "spl vs token‑2022"). Publish 1–2 new guides/week targeting real queries (use Search Console's query report to find what you're *almost* ranking for, then improve those pages).
- **Backlinked tools rank:** the free converters (`/tools/sol-converter`, `/tools/unit-converter`) attract links naturally — promote them.
- **Core Web Vitals:** already a Next.js SSG/edge build; keep LCP fast (the `<img>` logos are tiny). Monitor in Search Console.
- **Reviews / mentions** on YouTube and crypto blogs feed AI answer engines.

**Realistic timeline:** new domains usually see meaningful organic traffic in
**8–16 weeks**, not days. For the first‑month 3,000‑token goal, **paid + community
distribution will drive launch volume**, while this SEO foundation compounds and
takes over months 2–6. Don't bet the launch on organic rank #1 in week one — bet
it on: this technical base + Search Console submission + aggressive community/X
distribution + a few quality backlinks.

---

## 4. Target keyword map (already wired into page titles)

| Page | Primary query |
|---|---|
| `/create-token` | create solana token, spl token creator |
| `/tools/multisender` | solana multisender, bulk send / airdrop solana tokens |
| `/tools/mint-tokens` | mint more solana tokens, increase token supply |
| `/tools/revoke-mint` | revoke mint authority solana |
| `/tools/revoke-freeze` | revoke freeze authority solana |
| `/tools/make-immutable` | make solana token immutable |
| `/tools/update-metadata` | update solana token metadata / logo |
| `/burn` | burn solana tokens |
| `/tools/sol-converter` | sol to lamports converter |
| blog | long‑tail "how to …" queries |

Verify rich results after deploy: https://search.google.com/test/rich-results
(test your live `/create-token` and a blog post — expect HowTo/FAQ/Breadcrumb).
