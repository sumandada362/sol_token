import Link from "next/link";
import Footer from "@/components/Footer";

export default function ToolPage({
  title,
  description,
  fee,
  feeLabel,
  docsSlug,
  blogSlug,
  children,
}: {
  title: string;
  description: string;
  fee?: string;
  feeLabel?: string;
  docsSlug?: string;
  blogSlug?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-page">
      <div className="page-wrap page-wrap--narrow">
        <div className="tool-header">
          <div className="tool-header-meta">
            <h1 className="page-title">{title}</h1>
            {fee && (
              <div className="tool-fee-badge">
                {fee}
                {feeLabel && <span className="tool-fee-label">{feeLabel}</span>}
              </div>
            )}
          </div>
          <p className="page-sub">{description}</p>
          <div className="tool-header-links">
            {docsSlug && (
              <Link href={`/docs/${docsSlug}`} className="tool-doc-link">Docs</Link>
            )}
            {blogSlug && (
              <Link href={`/blog/${blogSlug}`} className="tool-doc-link">Guide</Link>
            )}
          </div>
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
}
