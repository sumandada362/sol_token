import type { Metadata, Viewport } from "next";
import "./globals.css";
import BgCanvas from "@/components/BgCanvas";
import DevnetBanner from "@/components/DevnetBanner";
import Navbar from "@/components/Navbar";
import MotionProvider from "@/components/MotionProvider";
import { WalletProvider } from "@/lib/wallet/WalletProvider";
import { JsonLdOrganization, JsonLdWebSite } from "@/components/JsonLd";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { googleVerificationToken } from "@/app_configs/integrations";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.dravyo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Solana Token — Create & Launch Solana Tokens",
  description:
    "Solana Token is the fastest and safest way to create and launch tokens on Solana. No coding, no complexity.",
  // Favicon + apple-touch icon come from the file conventions app/icon.png and
  // app/apple-icon.png (coin_gold.png) — Next emits the <link> tags automatically.
  openGraph: {
    title: "Solana Token — Create & Launch Solana Tokens",
    description:
      "The fastest and safest way to create and launch tokens on Solana. No coding, no complexity.",
    url: SITE_URL,
    siteName: "Solana Token",
    images: [{ url: "/coin_gold.png", width: 1024, height: 1024, alt: "Solana Token" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Solana Token — Create & Launch Solana Tokens",
    description:
      "The fastest and safest way to create and launch tokens on Solana. No coding, no complexity.",
    images: ["/coin_gold.png"],
  },
  // Search-engine ownership verification. Drop the codes into your env to emit the
  // <meta> tags — required to submit the sitemap in Google Search Console / Yandex
  // / Bing, which is the fastest way to get a new domain indexed. Undefined codes
  // are simply omitted.
  verification: {
    google: googleVerificationToken() ?? process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : {},
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <JsonLdOrganization />
        <JsonLdWebSite />
        <WalletProvider>
          {/* z-index: -1 — fixed rotating-disc background (never scrolls) */}
          <BgCanvas />
          {/* Visible only on non-mainnet builds — prevents wrong-cluster confusion */}
          <DevnetBanner />
          {/* Opaque top scrim — content scrolling up disappears cleanly behind the navbar */}
          <div className="nav-scrim" aria-hidden="true" />
          {/* z-index: 2 — glassmorphism navbar */}
          <Navbar />
          {/* z-index: 1 — scrollable content (hero + every other section) */}
          <div id="content">{children}</div>
          <MotionProvider />
          {/* GA4 — injected on every page from lib/integrations.ts (no-op when unset) */}
          <GoogleAnalytics />
        </WalletProvider>
      </body>
    </html>
  );
}
