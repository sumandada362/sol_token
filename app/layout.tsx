import type { Metadata, Viewport } from "next";
import "./globals.css";
import BgCanvas from "@/components/BgCanvas";
import DevnetBanner from "@/components/DevnetBanner";
import Navbar from "@/components/Navbar";
import MotionProvider from "@/components/MotionProvider";
import InteractiveEffects from "@/components/InteractiveEffects";
import { WalletProvider } from "@/lib/wallet/WalletProvider";

export const metadata: Metadata = {
  title: "Vajra — Create & Launch Solana Tokens",
  description:
    "FORGE is the fastest and safest way to create and launch tokens on Solana Network. No Coding, No Complexity.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {/* z-index: -1 — fixed rotating-disc background (never scrolls) */}
          <BgCanvas />
          {/* z-index: 0 — cursor-reactive ambient glow */}
          <InteractiveEffects />
          {/* Visible only on non-mainnet builds — prevents wrong-cluster confusion */}
          <DevnetBanner />
          {/* z-index: 2 — glassmorphism navbar */}
          <Navbar />
          {/* z-index: 1 — scrollable content (hero + every other section) */}
          <div id="content">{children}</div>
          <MotionProvider />
        </WalletProvider>
      </body>
    </html>
  );
}
