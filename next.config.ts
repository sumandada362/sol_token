import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (default in Next.js 16) handles Node.js module resolution
  // automatically for server/client boundaries — no webpack fallbacks needed.
  turbopack: {},
};

export default nextConfig;
