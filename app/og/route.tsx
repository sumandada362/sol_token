import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams, origin, host } = new URL(request.url);
  const title = searchParams.get("title") ?? "Create & Launch Solana Tokens";
  const sub = searchParams.get("sub") ?? "Create, manage, and analyze Solana tokens";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "60px 72px",
          background: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #f97316, #fb923c)",
          }}
        />

        {/* logo mark */}
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 72,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${origin}/coin_gold.png`}
            width={40}
            height={40}
            style={{ borderRadius: 8 }}
            alt="Solana Token"
          />
          <span style={{ color: "#fff", fontSize: 20, fontWeight: 600, letterSpacing: -0.5 }}>
            Solana Token
          </span>
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: -1,
            marginBottom: 20,
            maxWidth: 900,
          }}
        >
          {title}
        </div>

        <div style={{ fontSize: 24, color: "#a3a3a3", maxWidth: 780 }}>{sub}</div>

        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 72,
            fontSize: 16,
            color: "#525252",
          }}
        >
          {host}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
