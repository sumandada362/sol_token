const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK;

export default function DevnetBanner() {
  if (NETWORK === "mainnet-beta") return null;
  const label = NETWORK === "devnet" ? "DEVNET" : (NETWORK?.toUpperCase() ?? "TESTNET");
  return (
    <div className="devnet-banner" role="alert">
      <span className="devnet-banner-dot" aria-hidden="true" />
      <strong>{label}</strong>
      &nbsp;— tokens have no real value · transactions use test SOL only
    </div>
  );
}
