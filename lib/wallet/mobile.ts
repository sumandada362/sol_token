/**
 * Mobile wallet helpers.
 *
 * Background: the Phantom/Solflare browser-extension adapters only work where a
 * wallet provider is injected into `window` — i.e. a desktop browser with the
 * extension, or inside a wallet app's own in-app browser. A plain mobile browser
 * (Safari / Chrome on a phone) has neither.
 *
 * - Android is covered by the Mobile Wallet Adapter (registered in
 *   WalletProvider.tsx), which hands off to the installed wallet app.
 * - iOS has no MWA equivalent (Apple disallows it), so the only reliable path is
 *   to re-open the site inside the wallet's in-app browser via a universal link.
 *   The builders below produce those links.
 */

/** True on any phone/tablet browser. SSR-safe (returns false when no navigator). */
export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * True on iOS/iPadOS. iPadOS 13+ reports a desktop "MacIntel" platform, so we
 * fall back to detecting a touch-capable Mac.
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/** Universal link that opens `url` inside Phantom's in-app browser. */
export function phantomBrowseLink(url: string): string {
  const ref = encodeURIComponent(new URL(url).origin);
  return `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${ref}`;
}

/** Universal link that opens `url` inside Solflare's in-app browser. */
export function solflareBrowseLink(url: string): string {
  const ref = encodeURIComponent(new URL(url).origin);
  return `https://solflare.com/ul/v1/browse/${encodeURIComponent(url)}?ref=${ref}`;
}
