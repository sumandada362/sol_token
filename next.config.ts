import type { NextConfig } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge.solana.tools";

// Trusted IPFS gateways that serve token images
const IPFS_SOURCES = [
  "https://ipfs.io",
  "https://*.ipfs.dweb.link",
  "https://*.pinata.cloud",
  "https://cf-ipfs.com",
  "https://gateway.pinata.cloud",
  "https://nftstorage.link",
].join(" ");

// Solana RPC + ws endpoints
const RPC_SOURCES = [
  "https://*.solana.com",
  "https://*.helius-rpc.com",
  "https://*.rpcpool.com",
  "https://*.rpc.extrnode.com",
  "wss://*.solana.com",
  "wss://*.helius-rpc.com",
  "wss://*.rpcpool.com",
].join(" ");

// Next.js injects inline hydration scripts — 'unsafe-inline' is required unless
// you implement nonce-per-request via middleware (tracked as a future hardening step).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
