"use client";
import Link from "next/link";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="app-page">
      <div className="sys-page">
        <div className="sys-page-content">
          <div className="sys-page-code">500</div>
          <h1 className="sys-page-title">Something went wrong</h1>
          <p className="lp-body lp-body--center">
            An unexpected error occurred. Try again — if the problem persists, check our status page.
          </p>
          <div className="lp-actions lp-actions--center">
            <button className="lp-btn lp-btn--primary" onClick={reset}>Try again</button>
            <Link href="/" className="lp-btn lp-btn--secondary">Back home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
