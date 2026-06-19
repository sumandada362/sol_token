# Graph Report - .  (2026-06-19)

## Corpus Check
- 170 files · ~82,410 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1006 nodes · 1734 edges · 94 communities (55 shown, 39 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 109 edges (avg confidence: 0.81)
- Token cost: ~155,295 tokens this refresh (2 subagents re-extracting 46 changed files; 124 files served from cache). All-time across runs: ~827,934.

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes & Lib Core|API Routes & Lib Core]]
- [[_COMMUNITY_App Pages & Routing|App Pages & Routing]]
- [[_COMMUNITY_Solana Transaction Builders|Solana Transaction Builders]]
- [[_COMMUNITY_Token Page Data Fetching|Token Page Data Fetching]]
- [[_COMMUNITY_Tool Page Layouts & SEO|Tool Page Layouts & SEO]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_End-to-End Test Script|End-to-End Test Script]]
- [[_COMMUNITY_Tx API Routes & Tools|Tx API Routes & Tools]]
- [[_COMMUNITY_Pool & Liquidity Pages|Pool & Liquidity Pages]]
- [[_COMMUNITY_MDX & Content Components|MDX & Content Components]]
- [[_COMMUNITY_Landing Page UI|Landing Page UI]]
- [[_COMMUNITY_Liquidity & Market Content|Liquidity & Market Content]]
- [[_COMMUNITY_Root Layout & RPC Config|Root Layout & RPC Config]]
- [[_COMMUNITY_API Security & Data Access|API Security & Data Access]]
- [[_COMMUNITY_Wallet Generator Script|Wallet Generator Script]]
- [[_COMMUNITY_Wallet Refresher Script|Wallet Refresher Script]]
- [[_COMMUNITY_Fee Sweeper Script|Fee Sweeper Script]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Deploy & Ops Surface|Deploy & Ops Surface]]
- [[_COMMUNITY_Blog & Docs Index Routes|Blog & Docs Index Routes]]
- [[_COMMUNITY_Testnet E2E Results|Testnet E2E Results]]
- [[_COMMUNITY_Devnet E2E Results|Devnet E2E Results]]
- [[_COMMUNITY_Wallet & RPC Proxy  CSP|Wallet & RPC Proxy / CSP]]
- [[_COMMUNITY_VPS Bootstrap Script|VPS Bootstrap Script]]
- [[_COMMUNITY_Mobile Wallet Navbar|Mobile Wallet Navbar]]
- [[_COMMUNITY_Hero Form & Animation|Hero Form & Animation]]
- [[_COMMUNITY_Next.js Config & CSP|Next.js Config & CSP]]
- [[_COMMUNITY_Tools & Token Detail Pages|Tools & Token Detail Pages]]
- [[_COMMUNITY_Test Wallet Tooling|Test Wallet Tooling]]
- [[_COMMUNITY_Tools Catalog|Tools Catalog]]
- [[_COMMUNITY_Security Checker & SEO Docs|Security Checker & SEO Docs]]
- [[_COMMUNITY_WebGL Background Shader|WebGL Background Shader]]
- [[_COMMUNITY_Dev Redis Stub|Dev Redis Stub]]
- [[_COMMUNITY_API Load Test|API Load Test]]
- [[_COMMUNITY_Wallet Session & RPC Proxy|Wallet Session & RPC Proxy]]
- [[_COMMUNITY_Site Layout & MDX Components|Site Layout & MDX Components]]
- [[_COMMUNITY_Deploy Script|Deploy Script]]
- [[_COMMUNITY_Mobile Wallet Deep Links|Mobile Wallet Deep Links]]
- [[_COMMUNITY_CORS Middleware|CORS Middleware]]
- [[_COMMUNITY_Hero UI & Motion Hooks|Hero UI & Motion Hooks]]
- [[_COMMUNITY_Incident Response Runbooks|Incident Response Runbooks]]
- [[_COMMUNITY_Page Smoke Test|Page Smoke Test]]
- [[_COMMUNITY_Converter Tool Pages|Converter Tool Pages]]
- [[_COMMUNITY_Gold Coin Brand Art|Gold Coin Brand Art]]
- [[_COMMUNITY_Redis Rate Limiting|Redis Rate Limiting]]
- [[_COMMUNITY_Docs Pages|Docs Pages]]
- [[_COMMUNITY_Fee Sweeper Wallets|Fee Sweeper Wallets]]
- [[_COMMUNITY_Load & Smoke QA|Load & Smoke QA]]
- [[_COMMUNITY_Legal Pages|Legal Pages]]
- [[_COMMUNITY_App Icons|App Icons]]
- [[_COMMUNITY_Blog Pages|Blog Pages]]
- [[_COMMUNITY_Multisend Validation|Multisend Validation]]
- [[_COMMUNITY_Vanity Address Content|Vanity Address Content]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Error & 404 Pages|Error & 404 Pages]]
- [[_COMMUNITY_Database Tables|Database Tables]]
- [[_COMMUNITY_Sitemap & Content Loader|Sitemap & Content Loader]]
- [[_COMMUNITY_Testnet Wallet Set|Testnet Wallet Set]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]

## God Nodes (most connected - your core abstractions)
1. `SITE_URL` - 29 edges
2. `getConnection()` - 28 edges
3. `rateLimit()` - 27 edges
4. `useScrollToTopOn()` - 23 edges
5. `apiError()` - 23 edges
6. `dependencies` - 22 edges
7. `useTransaction()` - 21 edges
8. `JsonLdBreadcrumb()` - 18 edges
9. `pageMeta()` - 17 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Burn tool layout (SEO scaffold)` --conceptually_related_to--> `Production deploy guide`  [AMBIGUOUS]
  app/burn/layout.tsx → deploy.md
- `CSRF / Fetch-Metadata Middleware` --semantically_similar_to--> `RPC method allowlist`  [INFERRED] [semantically similar]
  middleware.ts → app/api/rpc/route.ts
- `Production deploy guide` --references--> `vps-bootstrap.sh provisioner`  [EXTRACTED]
  deploy.md → scripts/vps-bootstrap.sh
- `GET()` --calls--> `getTokenPageData()`  [INFERRED]
  app/api/tokens/[mint]/route.ts → lib/data/cache.ts
- `GET()` --calls--> `rateLimit()`  [INFERRED]
  app/api/tokens/wallet/[wallet]/route.ts → lib/rateLimit.ts

## Hyperedges (group relationships)
- **Redis-first, Postgres-fallback read pattern** — tokensmint_GET, walletlist_GET, lib_db_redis, lib_db_postgres [INFERRED 0.85]
- **tx route validate to build to serialize pattern** — lib_solana_validate, lib_solana_buildBurn, lib_solana_buildCreateToken, lib_solana_buildMintMore, lib_rateLimit, lib_api_errors [INFERRED 0.85]
- **Client tx build/sign/confirm flow (build route -> useTransaction -> confirm)** — page_burn, page_createToken, page_freezeAccount, ext_useTransaction, ext_route_confirm [INFERRED 0.85]
- **Shared ToolPage scaffold: check-authority gate + useTransaction + BalanceCheck** — minttokens_page, unfreezeaccount_page, updatemetadata_page [INFERRED 0.75]
- **Authority-revocation tools (check-authority -> tx/revoke -> confirm flow)** — revokemint_page, revokefreeze_page, revokeupdate_page, makeimmutable_page [INFERRED 0.85]
- **Freeze-authority gated tools** — revokefreeze_page, unfreezeaccount_page, api_tx_freeze_accounts [INFERRED 0.65]
- **Reduced-motion-aware animation consumers** — customizetokenpanel_component, typewriter_component, usereducedmotion_lib [INFERRED 0.85]
- **MDX content pipeline (index + article pages share lib/content)** — page_blog, page_blogArticle, page_docs, page_docsArticle, ext_content [INFERRED 0.85]
- **Server-side API security primitives** — ratelimit_lib, safeurl_lib, phase2_tokencache_table [INFERRED 0.65]
- **Data modules assembled by the read-through token-page cache** — cache_fetchLiveTokenPageData, holders_getTopHolders, market_getTokenOverview, risk_computeRiskFlags [INFERRED 0.80]
- **Local Redis emulation for dev (stub backs redis client + rate limiter)** — devredis_devRedisStub, redis_redisClient, rateLimit_rateLimiter [INFERRED 0.75]
- **OpenBook vs Raydium AMM/CPMM Content** — blog_openbookmarket, docs_openbookmarket, concept_openbook_market, concept_raydium_legacy_amm, concept_raydium_cpmm [INFERRED 0.80]
- **Liquidity Pool Content (blogs + docs covering pools/LP/Raydium)** — blog_addremoveliquidity, blog_createliquiditypool, docs_addliquidity, concept_liquidity_pool, concept_lp_tokens, concept_raydium_cpmm [INFERRED 0.85]
- **Authority Revocation Content (mint/freeze/update + immutable + scanners)** — blog_revokemintfreeze, blog_revokeupdate, docs_revokeupdate, concept_mint_authority, concept_freeze_authority, concept_update_authority, concept_make_immutable, concept_dex_scanners [INFERRED 0.85]
- **Incident Response Runbook Set** — baddeploy_rollback, feewalletcompromised_rotation, rpcoutage_failover [INFERRED 0.85]
- **Browser RPC proxy data flow (client → /api/rpc → pool → endpoint)** — WalletProvider_rpcProxyEndpoint, rpcroute_POST, rpcpool_leaseRpc, integrations_RPC_ENDPOINTS [INFERRED 0.85]
- **Tx builders lease one RPC and run connection+umi+simulate on it** — buildCreateToken_buildCreateTokenTx, buildRevoke_buildRevokeTx, buildUpdateMetadata_buildUpdateMetadataTx, rpcpool_leaseRpc [INFERRED 0.85]
- **SEO surfaces consuming the resolved SITE_URL** — seo_pageMeta, JsonLd_JsonLdOrganization, JsonLd_JsonLdWebSite, seo_SITE_URL [INFERRED 0.75]
- **Incident-response runbook set** — rpcoutage_concept, webhookoutage_concept, baddeploy_concept, feewallet_concept [INFERRED 0.85]
- **Production deploy pipeline (guide -> bootstrap -> deploy)** — deploymd_guide, vpsbootstrap_bootstrap, deploysh_deploy [INFERRED 0.85]
- **Pool/LP coming-soon tab cluster** — poolpage_PoolPage, pooladd_PoolAddPage, poolremove_PoolRemovePage [INFERRED 0.75]

## Communities (94 total, 39 thin omitted)

### Community 0 - "API Routes & Lib Core"
Cohesion: 0.06
Nodes (79): apiError(), POST(), MIN_FEE_LAMPORTS, POST(), schema, POST(), POST(), pubkey (+71 more)

### Community 1 - "App Pages & Routing"
Cohesion: 0.07
Nodes (50): BurnPage(), AuthorityInfo, GET(), OffChainMeta, shortMint(), TokenSelect(), WalletToken, CreatePage() (+42 more)

### Community 2 - "Solana Transaction Builders"
Cohesion: 0.05
Nodes (60): buildBurnTx, buildCreateTokenTx, buildFreezeAccountsTx, buildMintMoreTx, buildMultisendTxs, buildRevokeTx, buildUpdateMetadataTx, fetchLiveTokenPageData (+52 more)

### Community 3 - "Token Page Data Fetching"
Cohesion: 0.07
Nodes (42): fetchLiveTokenPageData(), fetchMetaplexMetadata(), getTokenPageData(), MetaplexMeta, TokenPageData, getMintSupply(), getTopHolders(), getTotalHolderCount() (+34 more)

### Community 4 - "Tool Page Layouts & SEO"
Cohesion: 0.07
Nodes (21): metadata, JsonLdBreadcrumb(), JsonLdHowTo(), metadata, metadata, ogImage(), pageMeta(), PageMetaInput (+13 more)

### Community 5 - "NPM Dependencies"
Cohesion: 0.04
Nodes (48): browserslist, dependencies, bs58, gray-matter, ioredis, @metaplex-foundation/mpl-token-metadata, @metaplex-foundation/umi, @metaplex-foundation/umi-bundle-defaults (+40 more)

### Community 6 - "End-to-End Test Script"
Cohesion: 0.07
Nodes (31): _agent, api(), assert(), ata, blob, checkAuthority(), confirmAction(), conn (+23 more)

### Community 7 - "Tx API Routes & Tools"
Cohesion: 0.11
Nodes (31): GET /api/check-authority, POST /api/tx/freeze-accounts, POST /api/tx/mint-more, POST /api/tx/multisend, POST /api/tx/revoke, POST /api/tx/update-metadata, BalanceCheck Component, Make Immutable Layout (SEO) (+23 more)

### Community 8 - "Pool & Liquidity Pages"
Cohesion: 0.07
Nodes (12): metadata, PROVIDERS, metadata, PROVIDERS, metadata, DEXES, metadata, metadata (+4 more)

### Community 9 - "MDX & Content Components"
Cohesion: 0.15
Nodes (17): NotFound(), JsonLdArticle(), contentDir(), getArticle(), CTA(), TOOL_LABELS, TOOL_ROUTES, Disclaimer() (+9 more)

### Community 10 - "Landing Page UI"
Cohesion: 0.09
Nodes (11): demoTokens, homeFaq, metadata, JsonLdFaqPage(), abs(), metadata, sections, metadata (+3 more)

### Community 11 - "Liquidity & Market Content"
Cohesion: 0.21
Nodes (23): Blog: Add & Remove Liquidity on Raydium, Blog: Create a Liquidity Pool on Raydium, Blog: What Is an OpenBook Market, Blog: Revoke Mint & Freeze Authority, Blog: Revoke Update Authority, DEX Scanners (Rugcheck/DEXScreener/Birdeye), Freeze Authority, Impermanent Loss (+15 more)

### Community 12 - "Root Layout & RPC Config"
Cohesion: 0.12
Nodes (11): googleAnalyticsId(), googleVerificationToken(), RPC_ENDPOINTS, RpcEndpoint, metadata, viewport, BgCanvas, GoogleAnalytics() (+3 more)

### Community 13 - "API Security & Data Access"
Cohesion: 0.14
Nodes (22): AuthorityInfo shape, GET /api/check-authority, lib/api/errors apiError, lib/data/cache getTokenPageData, lib/db/postgres query/queryOne, lib/db/redis cache helpers + CACHE_KEYS, lib/rateLimit (rateLimit/rateLimitByKey/RATE_LIMITS), lib/safeUrl isSafeExternalUrl (SSRF guard) (+14 more)

### Community 14 - "Wallet Generator Script"
Cohesion: 0.13
Nodes (18): _agent, airdropTotal(), airdropWithRetry(), APPEND, buildTxt(), COUNT, deriveKeypair(), { derivePath } (+10 more)

### Community 15 - "Wallet Refresher Script"
Cohesion: 0.14
Nodes (16): _agent, airdropWithRetry(), CHECK_ONLY, __dirname, _fetch(), IN_FILE, main(), MIN_SOL (+8 more)

### Community 16 - "Fee Sweeper Script"
Cohesion: 0.16
Nodes (18): die(), __dirname, generateWallet(), main(), parseSecret(), persist(), randomNumber(), readExisting() (+10 more)

### Community 17 - "TypeScript Config"
Cohesion: 0.1
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 18 - "Deploy & Ops Surface"
Cohesion: 0.15
Nodes (19): Bad Deploy, Burn tool layout (SEO scaffold), Burn LP tokens page (coming soon), Create-token wizard page, Production deploy guide, deploy.sh production deploy script, Fee Wallet Compromised, RootLayout (app shell) (+11 more)

### Community 19 - "Blog & Docs Index Routes"
Cohesion: 0.17
Nodes (14): sitemap(), BlogPage(), CATEGORIES, metadata, JsonLdSoftwareApplication(), CATEGORY_ORDER, DocsPage(), metadata (+6 more)

### Community 20 - "Testnet E2E Results"
Cohesion: 0.11
Nodes (17): base, createdMints, A, A_sig, B, B_sig, C, D (+9 more)

### Community 21 - "Devnet E2E Results"
Cohesion: 0.13
Nodes (14): base, createdMints, A, A_sig, B, B_sig, C, endBal (+6 more)

### Community 22 - "Wallet & RPC Proxy / CSP"
Cohesion: 0.15
Nodes (13): GoogleAnalytics component, JsonLdOrganization, JsonLdWebSite, WalletProvider component, rpcProxyEndpoint (/api/rpc URL builder), SessionRecord (localStorage), WalletSessionGuard, Content-Security-Policy (+5 more)

### Community 23 - "VPS Bootstrap Script"
Cohesion: 0.27
Nodes (7): free_port(), getenv(), green(), have(), info(), port_in_use(), setenv_if_needed()

### Community 24 - "Mobile Wallet Navbar"
Cohesion: 0.31
Nodes (5): MobileWalletButton(), Navbar(), isMobileBrowser(), phantomBrowseLink(), solflareBrowseLink()

### Community 25 - "Hero Form & Animation"
Cohesion: 0.29
Nodes (5): CustomizeTokenPanel(), PHRASES, PHRASES, Typewriter(), useReducedMotion()

### Community 26 - "Next.js Config & CSP"
Cohesion: 0.2
Nodes (8): CSP, _envFile, IPFS_SOURCES, _m, nextConfig, RPC_SOURCES, securityHeaders, _val

### Community 27 - "Tools & Token Detail Pages"
Cohesion: 0.22
Nodes (10): ToolsGrid Component, API Route: check-authority (external), API Route: token/[mint] (external), API Route: tx/burn (external), API Route: tx/freeze-accounts (external), Freeze Account Layout (SEO/JSON-LD), Burn Tokens Page, Freeze Account Page (+2 more)

### Community 28 - "Test Wallet Tooling"
Cohesion: 0.31
Nodes (10): Devnet E2E Results, Wallet Import Guide (.txt for Phantom/Solflare/Backpack), Test Wallet Generator, fetch/TLS Polyfill Before web3.js, Wallet Balance Refresher, 429 Self-Pacing Rationale (production limits stay strict), HTTP-Polling Confirmation (no WebSocket in TLS-intercept envs), End-to-End Feature Test (+2 more)

### Community 29 - "Tools Catalog"
Cohesion: 0.22
Nodes (6): categories, feeNotes, metadata, tools, Category, Tool

### Community 30 - "Security Checker & SEO Docs"
Cohesion: 0.25
Nodes (9): Authority Badges, Holder Concentration Risk, Liquidity Lock Status, Security Checker, Target Keyword Map, SEO & AI-Discoverability, Structured Data (JSON-LD), Metaplex Token Metadata Program (+1 more)

### Community 31 - "WebGL Background Shader"
Cohesion: 0.25
Nodes (6): CPIT, CYAW, SPIT, SYAW, TC, TS

### Community 32 - "Dev Redis Stub"
Cohesion: 0.29
Nodes (5): alive(), PORT, run(), server, store

### Community 33 - "API Load Test"
Cohesion: 0.25
Nodes (7): confirmPayload, confirmRes, HEADERS, homeRes, options, txPayload, txRes

### Community 34 - "Wallet Session & RPC Proxy"
Cohesion: 0.33
Nodes (3): WalletProvider(), SessionRecord, WalletSessionGuard()

### Community 35 - "Site Layout & MDX Components"
Cohesion: 0.33
Nodes (6): content (MDX article loader), CTA (MDX call-to-action), Disclaimer (MDX legal disclaimer), Fee (MDX fee badge), Footer (site footer), ToolPage (tool page scaffold)

### Community 37 - "Mobile Wallet Deep Links"
Cohesion: 0.4
Nodes (5): MobileWalletButton (iOS deep-link), Navbar component, isMobileBrowser, phantomBrowseLink (universal link), solflareBrowseLink (universal link)

### Community 38 - "CORS Middleware"
Cohesion: 0.5
Nodes (4): ALLOWED_ORIGINS, config, isStateMutatingApiRoute(), middleware()

### Community 39 - "Hero UI & Motion Hooks"
Cohesion: 0.5
Nodes (5): CustomizeTokenPanel (hero token form), MotionProvider (reveal-on-scroll), Typewriter (hero typewriter), useConsentShake hook, useReducedMotion hook

### Community 40 - "Incident Response Runbooks"
Cohesion: 0.5
Nodes (4): Bad Deploy / Instant Rollback Runbook, Why Instant Rollback First, Fee Wallet Compromise Runbook, Why Rotate Fee Wallet Immediately

### Community 42 - "Converter Tool Pages"
Cohesion: 0.5
Nodes (4): SOL Converter Layout (SEO), SOL Price Converter Page, Unit Converter Layout (SEO), Unit Converter Page

### Community 43 - "Gold Coin Brand Art"
Cohesion: 0.67
Nodes (3): Gold Coin Artwork, Chevron/Play Arrow Glyph, Gold Coin Logo Mark

### Community 44 - "Redis Rate Limiting"
Cohesion: 1.0
Nodes (3): dev-redis.mjs — in-memory RESP2 Redis stub, lib/rateLimit.ts — rate limiter, lib/db/redis.ts — Redis client

### Community 45 - "Docs Pages"
Cohesion: 0.67
Nodes (3): Docs index page, Docs article page ([slug]), OpenBook market create page (coming soon)

### Community 46 - "Fee Sweeper Wallets"
Cohesion: 0.67
Nodes (3): Sweeper App-Independence + Git-Ignored Keys Rationale, Mainnet Fee Sweeper, Fee Sweeper Wallets

### Community 47 - "Load & Smoke QA"
Cohesion: 0.67
Nodes (3): QA Matrix B4 Success Criteria (no 5xx, p95<2s), k6 API Load Test, Page Smoke Test

### Community 48 - "Legal Pages"
Cohesion: 1.0
Nodes (3): Privacy Policy Page, Risk Disclaimer Page, Terms of Service Page

## Ambiguous Edges - Review These
- `Burn tool layout (SEO scaffold)` → `Production deploy guide`  [AMBIGUOUS]
  app/burn/layout.tsx · relation: conceptually_related_to

## Knowledge Gaps
- **405 isolated node(s):** `eslintConfig`, `ALLOWED_ORIGINS`, `config`, `_envFile`, `_m` (+400 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Burn tool layout (SEO scaffold)` and `Production deploy guide`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `SITE_URL` connect `Tool Page Layouts & SEO` to `Pool & Liquidity Pages`, `MDX & Content Components`, `Blog & Docs Index Routes`, `Root Layout & RPC Config`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `getConnection()` connect `API Routes & Lib Core` to `App Pages & Routing`, `Token Page Data Fetching`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `rateLimit()` connect `API Routes & Lib Core` to `Token Page Data Fetching`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `rateLimit()` (e.g. with `GET()` and `GET()`) actually correct?**
  _`rateLimit()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `eslintConfig`, `ALLOWED_ORIGINS`, `config` to the rest of the system?**
  _405 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `API Routes & Lib Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._