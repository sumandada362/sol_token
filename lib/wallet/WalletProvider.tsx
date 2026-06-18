"use client";
import { ReactNode, useCallback, useMemo } from "react";
import { ConnectionProvider, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";
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
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.dravyo.com";

// Map our env network string to the adapter network enum so the explicit wallet
// adapters deep-link to the right cluster (e.g. Solflare's hosted mobile flow).
const ADAPTER_NETWORK =
  NETWORK === "mainnet-beta"
    ? WalletAdapterNetwork.Mainnet
    : NETWORK === "testnet"
      ? WalletAdapterNetwork.Testnet
      : WalletAdapterNetwork.Devnet;

export function WalletProvider({ children }: { children: ReactNode }) {
  // Built once per mount (Strict Mode is off, so no double-invoke remount churn).
  // The wallet set covers every platform:
  //   • Android (non-WebView) → SolanaMobileWalletAdapter native connect flow.
  //     It self-activates only on Android, so it is a no-op on desktop/iOS.
  //   • iOS Safari → Phantom/Solflare report `Loadable` and connect() deep-links
  //     into the wallet's in-app browser (https://phantom.app/ul/browse/…).
  //   • Desktop → the Wallet Standard auto-detects Phantom/Solflare (dedup'd
  //     against these explicit adapters, so no duplicate entries appear).
  // Solflare is given the network so its hosted mobile flow targets the right cluster.
  const wallets = useMemo(() => {
    // Prefer the live origin so the wallet shows the user the real host they're on.
    const appUri = typeof window !== "undefined" ? window.location.origin : APP_URL;
    return [
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: { name: "Solana Token", uri: appUri, icon: "/coin_gold_mark.png" },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: NETWORK, // must match the connection cluster or signing fails
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network: ADAPTER_NETWORK }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
