import type { NextConfig } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solanatoken.dravyo.com";

// Trusted IPFS gateways that serve token images
const IPFS_SOURCES = [
  "https://ipfs.io",
  "https://*.ipfs.dweb.link",
  "https://*.pinata.cloud",
  "https://cf-ipfs.com",
  "https://gateway.pinata.cloud",
  "https://nftstorage.link",
].join(" ");

// Solana RPC + ws endpoints. The browser wallet adapter connects straight to
// NEXT_PUBLIC_RPC_URL, so that origin MUST be in connect-src or the browser
// blocks every RPC call (silent wallet failures). We allow the well-known
// providers, plus whatever NEXT_PUBLIC_RPC_URL is set to at build time, plus an
// optional space-separated CSP_CONNECT_SRC_EXTRA for any other host (a separate
// websocket endpoint, a second gateway, analytics, etc.).
//
// NOTE: these are read at BUILD time — run `pnpm build` with your production env
// loaded so the right origin is baked into the served CSP header.
function rpcOriginVariants(url: string | undefined): string[] {
  if (!url) return [];
  try {
    const { host } = new URL(url);
    return [`https://${host}`, `wss://${host}`];
  } catch {
    return [];
  }
}

const RPC_SOURCES = [
  "https://*.solana.com",
  "https://*.helius-rpc.com",
  "https://*.rpcpool.com",
  "https://*.rpc.extrnode.com",
  "wss://*.solana.com",
  "wss://*.helius-rpc.com",
  "wss://*.rpcpool.com",
  ...rpcOriginVariants(process.env.NEXT_PUBLIC_RPC_URL),
  ...(process.env.CSP_CONNECT_SRC_EXTRA?.split(/\s+/).filter(Boolean) ?? []),
].join(" ");

// Next.js injects inline hydration scripts — 'unsafe-inline' is required unless
// you implement nonce-per-request via middleware (tracked as a future hardening step).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // BgCanvas runs its render loop in a Worker created from a blob: URL —
  // worker-src falls back to script-src (no blob:) without this.
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IPFS_SOURCES}`,
  "font-src 'self' data:",
  `connect-src 'self' ${RPC_SOURCES} ${IPFS_SOURCES}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  // Prevents the page from being loaded in a frame — mitigates clickjacking
  // (a wallet-signing UI framed by an attacker is a real vector).
  { key: "X-Frame-Options", value: "DENY" },
  // Prevents MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin (no path) in the Referer header to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down browser feature APIs we don't use
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  // Force HTTPS for 2 years, include subdomains
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // CSP — defense in depth
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // Disabled during testing — Strict Mode double-invokes effects and causes wallet disconnect loops
  reactStrictMode: false,
  turbopack: {},

  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // OG image route must allow cross-origin embedding (for social platforms)
        source: "/og",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cache-Control", value: "public, max-age=86400, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
