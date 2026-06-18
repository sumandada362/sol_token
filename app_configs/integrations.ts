/**
 * Third-party tags — paste what each platform gives you BETWEEN THE BACKTICKS
 * (`…`) and the app injects it into the page <head> on EVERY page automatically.
 * Backticks (not quotes) so you can paste a multi-line snippet that contains
 * quotes. Leave empty to disable. After editing, rebuild (`pnpm build`) + redeploy.
 */

// Google Search Console (https://search.google.com/search-console) — "HTML tag"
// method. Paste the whole <meta …> tag, OR just its token, between the backticks.
export const GOOGLE_SITE_VERIFICATION = ``;

// Google Analytics GA4 (https://analytics.google.com -> Admin -> Data streams ->
// your web stream). Paste the whole gtag <script>…</script> snippet, OR just the
// Measurement ID (G-XXXXXXX), between the backticks. Example:
//   export const GOOGLE_ANALYTICS = `G-QC8BQXXXXX`;
export const GOOGLE_ANALYTICS = ``;

/** Token to emit as <meta name="google-site-verification">, or undefined if unset. */
export function googleVerificationToken(): string | undefined {
  const raw = GOOGLE_SITE_VERIFICATION.trim();
  if (!raw) return undefined;
  const tag = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  return (tag ? tag[1] : raw).trim() || undefined;
}

/** GA4 Measurement ID (G-XXXX) used to load gtag.js on every page, or undefined. */
export function googleAnalyticsId(): string | undefined {
  const raw = GOOGLE_ANALYTICS.trim();
  if (!raw) return undefined;
  const id = raw.match(/G-[A-Z0-9]+/i);
  return (id ? id[0] : raw).trim() || undefined;
}
