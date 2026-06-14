/**
 * Third-party tags — paste what each platform gives you here and the app injects
 * it into the page <head> on EVERY page automatically. Leave "" to disable.
 * After editing, rebuild (`pnpm build`) and redeploy so the change is baked in.
 */

// Google Search Console (https://search.google.com/search-console) — add a
// "URL prefix" property, choose the "HTML tag" method, paste the whole <meta> tag
// or just its token.
export const GOOGLE_SITE_VERIFICATION = "";

// Google Analytics GA4 (https://analytics.google.com -> Admin -> Data streams ->
// your web stream) — paste the Measurement ID (G-XXXXXXX) or the whole gtag snippet.
export const GOOGLE_ANALYTICS = "";

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
