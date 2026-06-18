"use client";
import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
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
// Prefer an explicit public RPC URL (e.g. Helius public endpoint) over the slow default
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(NETWORK);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://solanatoken.dravyo.com";

export function WalletProvider({ children }: { children: ReactNode }) {
  // Built once per mount (Strict Mode is off, so no double-invoke remount churn).
  // The Mobile Wallet Adapter self-activates only on Android — it is a no-op on
  // desktop and iOS — so it is always safe to include. Phantom/Solflare cover the
  // desktop extension and the in-app-browser cases.
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
      new SolflareWalletAdapter(),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ConnectionProvider endpoint={RPC_ENDPOINT}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <WalletSessionGuard>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletSessionGuard>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}
