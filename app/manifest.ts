import type { MetadataRoute } from "next";

// PWA web app manifest — emitted at /manifest.webmanifest and linked automatically
// by Next. Improves "Add to Home Screen", mobile install prompts, and how the
// browser chrome/tab renders the brand.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solana Token — Create & Launch Solana Tokens",
    short_name: "Solana Token",
    description:
      "Create, manage, and launch Solana tokens (SPL & Token-2022) in minutes — no code. Mint, burn, multisend, update metadata, and revoke authorities from your own wallet.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/coin_gold.png", sizes: "192x192", type: "image/png" },
      { src: "/coin_gold.png", sizes: "512x512", type: "image/png" },
      { src: "/coin_gold.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
