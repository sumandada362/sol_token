import Link from "next/link";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="app-page">
      <div className="sys-page">
        <div className="sys-page-content">
          <div className="sys-page-code">404</div>
          <h1 className="sys-page-title">Token or page not found</h1>
          <p className="lp-body lp-body--center">
            The page or token you&apos;re looking for doesn&apos;t exist. Double-check the URL or explore what&apos;s out there.
          </p>
          <div className="sys-page-search">
            <input className="wizard-input" type="search" placeholder="Search for a token…" />
          </div>
          <div className="lp-actions lp-actions--center">
            <Link href="/" className="lp-btn lp-btn--primary">Back home</Link>
            <Link href="/tools" className="lp-btn lp-btn--secondary">Browse tools</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
