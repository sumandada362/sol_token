"use client";
import { ReactNode, useCallback, useMemo } from "react";
import { ConnectionProvider, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletSessionGuard } from "./WalletSessionGuard";

// Wallet adapter CSS — scoped to the modal only, does not affect app styles
import "@solana/wallet-adapter-react-ui/styles.css";

const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "devnet" | "testnet" | "mainnet-beta") ?? "devnet";
// Prefer an explicit public RPC URL (e.g. Helius public endpoint) over the slow,
// browser-throttled default. clusterApiUrl(mainnet) returns the public
// api.mainnet-beta.solana.com endpoint, which 403/429s browser sendTransaction —
// so NEXT_PUBLIC_RPC_URL must be set in any real (esp. mainnet/mobile) deployment.
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(NETWORK);

// Map our env network string to the adapter network enum so wallet adapters
// (and the auto-registered Mobile Wallet Adapter) deep-link to the right cluster.
const ADAPTER_NETWORK =
  NETWORK === "mainnet-beta"
    ? WalletAdapterNetwork.Mainnet
    : NETWORK === "testnet"
      ? WalletAdapterNetwork.Testnet
      : WalletAdapterNetwork.Devnet;

export function WalletProvider({ children }: { children: ReactNode }) {
  // Module/instance-level singletons — prevents adapter recreation on remounts.
  // Phantom & Solflare are kept explicitly so MOBILE works without an extension:
  //   • iOS Safari → these adapters report `Loadable` and connect() deep-links
  //     into the wallet's in-app browser (https://phantom.app/ul/browse/…).
  //   • Android (non-WebView) → wallet-adapter-react auto-registers the Solana
  //     Mobile Wallet Adapter on top of these for the native connect flow.
  //   • Desktop → the Wallet Standard auto-detects them (dedup'd against these),
  //     so no duplicate entries appear.
  // Solflare is given the network so its hosted mobile flow targets the right cluster.
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: ADAPTER_NETWORK })],
    []
  );

  // Surface wallet errors instead of failing silently — a silent connect/sign
  // rejection is the most common "nothing happens on mobile" symptom. User
  // rejections are expected and stay quiet.
  const onError = useCallback((error: WalletError) => {
    if (error?.name === "WalletNotSelectedError") return;
    console.error("[wallet]", error?.name ?? "WalletError", error?.message ?? error);
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <AdapterWalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletSessionGuard>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletSessionGuard>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}
