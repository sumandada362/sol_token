/**
 * Third-party tags — paste what each platform gives you BETWEEN THE BACKTICKS
 * (`…`) and the app injects it into the page <head> on EVERY page automatically.
 * Backticks (not quotes) so you can paste a multi-line snippet that contains
 * quotes. Leave empty to disable. After editing, rebuild (`pnpm build`) + redeploy.
 */

// Google Search Console (https://search.google.com/search-console) — "HTML tag"
// method. Paste the whole <meta …> tag, OR just its token, between the backticks.
export const GOOGLE_SITE_VERIFICATION = ``;

// Google Analytics GA4 (https://analytics.google.com -> Admin -> Data streams ->
// your web stream). Paste the whole gtag <script>…</script> snippet, OR just the
// Measurement ID (G-XXXXXXX), between the backticks. Example:
//   export const GOOGLE_ANALYTICS = `G-QC8BQXXXXX`;
export const GOOGLE_ANALYTICS = ``;

/** Token to emit as <meta name="google-site-verification">, or undefined if unset. */
export function googleVerificationToken(): string | undefined {
  const raw = GOOGLE_SITE_VERIFICATION.trim();
  if (!raw) return undefined;
  const tag = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  return (tag ? tag[1] : raw).trim() || undefined;
}

/** GA4 Measurement ID (G-XXXX) used to load gtag.js on every page, or undefined. */
export function googleAnalyticsId(): string | undefined {
  const raw = GOOGLE_ANALYTICS.trim();
  if (!raw) return undefined;
  const id = raw.match(/G-[A-Z0-9]+/i);
  return (id ? id[0] : raw).trim() || undefined;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Solana RPC endpoints — SERVER-SIDE rotation pool
 * ──────────────────────────────────────────────────────────────────────────
 * ⚠️  SERVER-ONLY + COMMITTED TO GIT. Each url below carries your API key, and
 *     this file is tracked in git — so whatever you paste here lives in your
 *     repository history (and on GitHub once you push). Use keys you are willing
 *     to commit: prefer usage/IP/domain-restricted keys, and rotate a key if the
 *     repo is ever shared or made public.
 *     NEVER import RPC_ENDPOINTS (or anything from this section) into a
 *     "use client" component — that would ship these keys to every visitor's
 *     browser. The browser wallet uses its own public NEXT_PUBLIC_RPC_URL env
 *     var, which is a separate, intentionally-public endpoint.
 *
 * Add one entry per RPC provider. Each entry is the two values you provide:
 *     tag — a short unique label (A, B, C, D, …). Used to pin a whole
 *           transaction to one endpoint (see lib/solana/rpcPool.ts → leaseRpc).
 *     url — the full RPC URL, including any ?api-key=… query string.
 *
 * Rotation behaviour (lib/solana/rpcPool.ts), so load isn't dumped on one RPC:
 *     • 0 entries  → the app refuses to start (configure at least one).
 *     • 1 entry    → that endpoint is always used; rotation is skipped entirely.
 *     • 2+ entries → round-robin: each new transaction/request leases the next
 *                    endpoint (A → B → C → A …), spreading the load.
 * ────────────────────────────────────────────────────────────────────────── */
export interface RpcEndpoint {
  tag: string;
  url: string;
}

export const RPC_ENDPOINTS: RpcEndpoint[] = [
  { tag: "A", url: `https://mainnet.helius-rpc.com/?api-key=d38d9e94-7b1b-420d-9761-be347fc0570a` },
  // Add more providers to spread the load — give each a new, unique tag:
  // { tag: "B", url: `https://your-second-provider.example/?api-key=...` },
  // { tag: "C", url: `https://your-third-provider.example/?api-key=...` },
];

/* ──────────────────────────────────────────────────────────────────────────
 * Browser (PUBLIC) Solana RPC — the ONE endpoint shipped to every visitor
 * ──────────────────────────────────────────────────────────────────────────
 * ⚠️  PUBLIC, unlike RPC_ENDPOINTS above. The browser wallet adapter connects to
 *     this directly, so its value is visible to every visitor. next.config.ts
 *     copies it into NEXT_PUBLIC_RPC_URL at build time — so you paste every RPC
 *     link in THIS file and never touch .env.local for RPC.
 *
 *     Because it is public, use a SEPARATE, domain/IP-restricted key here — do
 *     NOT reuse a private RPC_ENDPOINTS key. Leave "" to fall back to the public
 *     cluster endpoint (heavily rate-limited; fine for local dev only).
 * ────────────────────────────────────────────────────────────────────────── */
export const PUBLIC_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=d38d9e94-7b1b-420d-9761-be347fc0570a`;
