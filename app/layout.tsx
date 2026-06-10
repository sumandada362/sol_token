import type { Metadata, Viewport } from "next";
import "./globals.css";
import BgCanvas from "@/components/BgCanvas";
import Navbar from "@/components/Navbar";

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
        {/* z-index: -1 — fixed rotating-disc background (never scrolls) */}
        <BgCanvas />
        {/* z-index: 2 — glassmorphism navbar */}
        <Navbar />
        {/* z-index: 1 — scrollable content (hero + every other section) */}
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
