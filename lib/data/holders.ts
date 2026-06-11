import { getConnection } from "@/lib/solana/connection";
import { PublicKey } from "@solana/web3.js";

const HELIUS_BASE = "https://mainnet.helius-rpc.com";

function heliusUrl() {
  return `${HELIUS_BASE}/?api-key=${process.env.HELIUS_API_KEY}`;
}

export interface HolderRaw {
  address: string; // token account address
  owner: string;   // wallet that owns the token account
  amount: bigint;
}

/**
 * Fetches the top-20 token accounts by balance using the standard RPC call.
 * Resolves owner wallets via getMultipleAccounts.
 * Cheap: 1 call + 1 getMultipleAccounts call.
 */
export async function getTopHolders(mint: string): Promise<HolderRaw[]> {
  const conn = getConnection();
  const mintPk = new PublicKey(mint);

  const largest = await conn.getTokenLargestAccounts(mintPk, "confirmed");
  if (!largest.value.length) return [];

  const addresses = largest.value.map((a) => new PublicKey(a.address));
  const infos = await conn.getMultipleAccountsInfo(addresses, "confirmed");

  return largest.value.map((a, i) => {
    const info = infos[i];
    const addrStr = typeof a.address === "string" ? a.address : (a.address as PublicKey).toBase58();
    // Token account data: owner is bytes 32-64
    let owner = addrStr; // fallback to self
    if (info?.data && info.data instanceof Buffer && info.data.length >= 64) {
      owner = new PublicKey(info.data.slice(32, 64)).toBase58();
    } else if (info?.data && Array.isArray(info.data)) {
      const buf = Buffer.from(info.data[0], "base64");
      if (buf.length >= 64) owner = new PublicKey(buf.slice(32, 64)).toBase58();
    }
    return {
      address: addrStr,
      owner,
      amount: BigInt(a.amount),
    };
  });
}

/**
 * Gets total holder count using Helius DAS getTokenAccounts (paginated).
 * Returns null on error (caller should use a cached/estimated value).
 */
export async function getTotalHolderCount(mint: string): Promise<number | null> {
  try {
    const url = heliusUrl();
    // First page — Helius returns total in the response
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "holders",
        method: "getTokenAccounts",
        params: { mint, limit: 1, page: 1 },
      }),
    });
    if (!res.ok) return null;
    const json = await res.json() as { result?: { total?: number } };
    return json.result?.total ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches mint supply (raw u64) for percentage calculations.
 */
export async function getMintSupply(mint: string): Promise<bigint> {
  const conn = getConnection();
  const info = await conn.getTokenSupply(new PublicKey(mint), "confirmed");
  return BigInt(info.value.amount);
}
