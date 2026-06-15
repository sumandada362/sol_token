import Script from "next/script";
import { googleAnalyticsId } from "@/app_configs/integrations";

/**
 * Loads Google Analytics (GA4) on every page. No-op when no Measurement ID is set
 * in lib/integrations.ts. Uses next/script so the gtag tags are injected and load
 * correctly across all routes (the Next.js-recommended equivalent of pasting the
 * snippet into <head>).
 */
export default function GoogleAnalytics() {
  const id = googleAnalyticsId();
  if (!id) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="lazyOnload"
      />
      <Script id="ga4-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
      </Script>
    </>
  );
}
