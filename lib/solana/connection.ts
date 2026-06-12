import { Connection } from "@solana/web3.js";

// Cross-cluster guardrail: catch mainnet/devnet RPC mismatches at startup
// rather than silently sending real transactions to the wrong cluster.
const _rpcUrl = process.env.SOLANA_RPC_URL ?? "";
const _network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";
const _rpcIsMainnet = /mainnet/.test(_rpcUrl);
const _rpcIsDevnet = /devnet/.test(_rpcUrl);
const _rpcIsTestnet = /testnet/.test(_rpcUrl);

if (_network === "mainnet-beta" && (_rpcIsDevnet || _rpcIsTestnet)) {
  throw new Error(
    `[guardrail] NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta but SOLANA_RPC_URL points at a test cluster. Check your .env.`
  );
}
if (_network !== "mainnet-beta" && _rpcIsMainnet) {
  throw new Error(
    `[guardrail] NEXT_PUBLIC_SOLANA_NETWORK=${_network} but SOLANA_RPC_URL contains "mainnet". Check your .env.`
  );
}
if (_network === "testnet" && _rpcIsDevnet) {
  throw new Error(
    `[guardrail] NEXT_PUBLIC_SOLANA_NETWORK=testnet but SOLANA_RPC_URL contains "devnet". Check your .env.`
  );
}
if (_network === "devnet" && _rpcIsTestnet) {
  throw new Error(
    `[guardrail] NEXT_PUBLIC_SOLANA_NETWORK=devnet but SOLANA_RPC_URL contains "testnet". Check your .env.`
  );
}

let _conn: Connection | null = null;

export function getConnection(): Connection {
  if (!_conn) {
    _conn = new Connection(_rpcUrl, "confirmed");
  }
  return _conn;
}
