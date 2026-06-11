import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge.solana.tools",
  // Allow localhost during dev
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

// Routes that modify state and must pass the CSRF origin check.
// Webhook routes are excluded (they have their own secret-header auth).
function isStateMutatingApiRoute(pathname: string): boolean {
  if (pathname.startsWith("/api/webhooks/")) return false;
  if (pathname.startsWith("/api/tx/")) return true;
  if (pathname === "/api/confirm") return true;
  if (pathname === "/api/upload") return true;
  if (pathname === "/api/subscriptions") return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname, method } = { pathname: request.nextUrl.pathname, method: request.method };

  // Only check POST/PUT/PATCH/DELETE — GET and HEAD are inherently safe
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return NextResponse.next();
  }

  if (!isStateMutatingApiRoute(pathname)) {
    return NextResponse.next();
  }

  // Primary check: Sec-Fetch-Site header (Fetch Metadata, supported by all modern browsers)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite) {
    // "same-origin" and "none" (direct navigation / non-browser) are acceptable.
    // "cross-site" and "same-site" (different subdomain) are rejected.
    if (secFetchSite !== "same-origin" && secFetchSite !== "none") {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  // Fallback: Origin header check (for older browsers / non-Fetch requests)
  const origin = request.headers.get("origin");
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
