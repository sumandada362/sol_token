"use client";
import { ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider as AdapterWalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Wallet adapter CSS — scoped to the modal only, does not affect app styles
import "@solana/wallet-adapter-react-ui/styles.css";

const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "devnet" | "mainnet-beta") ?? "devnet";
// Prefer an explicit public RPC URL (e.g. Helius public endpoint) over the slow default
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(NETWORK);

export function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = RPC_ENDPOINT;
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}
