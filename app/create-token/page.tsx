import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Token — Vajra",
  description: "Configure and deploy your Solana token.",
};

export default function CreateTokenPage() {
  return (
    <section
      className="section"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "1.5rem",
      }}
    >
      <h1
        style={{
          fontFamily: "'Segoe UI', Inter, Arial, sans-serif",
          fontSize: "clamp(2rem, 4vw, 3rem)",
          fontWeight: 700,
          background: "linear-gradient(90deg, #845ef7 0%, #5b8df7 50%, #29b6f6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Create Your Token
      </h1>
      <p
        style={{
          fontFamily: "'Segoe UI', Inter, Arial, sans-serif",
          color: "#8892a4",
          maxWidth: "52ch",
          lineHeight: 1.6,
          fontSize: "clamp(1rem, 1.3vw, 1.2rem)",
        }}
      >
        Full token creation &amp; advanced settings will live here — supply controls,
        mint &amp; freeze authorities, metadata, fees, and one-click deployment to the
        Solana network.
      </p>
      <Link href="/" className="hero-cta">
        ← Back to Home
      </Link>
    </section>
  );
}
