"use client";

import Link from "next/link";
import { use } from "react";
import { redirect } from "next/navigation";

// Token-specific multisender — redirect to main page with mint pre-filled.
// This page is kept so old links (/tools/multisender/solana) still work.
export default function MultisenderTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  // If it looks like a mint address, redirect to the main multisender with ?mint=
  if (token.length >= 32) {
    redirect(`/tools/multisender?mint=${token}`);
  }

  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">Multisender</h1>
          </div>
          <p className="page-sub">Paste the token mint address to get started.</p>
          <div className="tool-header-links">
            <Link href="/tools/multisender" className="tool-doc-link">← Open multisender</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
