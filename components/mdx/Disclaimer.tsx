import Link from "next/link";

export function Disclaimer() {
  return (
    <p className="mdx-disclaimer">
      This article is for informational purposes only and does not constitute financial or investment
      advice. On-chain actions are irreversible. Always verify costs and risks before signing a
      transaction.{" "}
      <Link href="/legal/risk">Read the full risk disclosure.</Link>
    </p>
  );
}
