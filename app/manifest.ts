import type { MetadataRoute } from "next";

// PWA web app manifest — emitted at /manifest.webmanifest and linked automatically
// by Next. Improves "Add to Home Screen", mobile install prompts, and how the
// browser chrome/tab renders the brand.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Solana Token — Create & Launch Solana Tokens",
    short_name: "Solana Token",
    description:
      "Dravyo Solana Token creator is the fastest and safest way to create and launch tokens on Solana — no coding, no complexity. Customize your token in a few clicks and it's ready to touch a million-dollar market cap.",
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
