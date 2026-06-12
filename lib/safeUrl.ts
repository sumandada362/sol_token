/**
 * Guards server-side fetches of attacker-controllable URLs (token metadata URIs).
 * Without this, a crafted mint's metadata URI pointing at an internal host
 * turns every metadata fetch into an SSRF primitive.
 */
const PRIVATE_HOST_RE =
  /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$|\[?f[cd][0-9a-f]{2}:)/i;

export function isSafeExternalUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (PRIVATE_HOST_RE.test(url.hostname)) return false;
  return true;
}
