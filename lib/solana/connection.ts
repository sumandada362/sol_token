import { Connection } from "@solana/web3.js";

let _conn: Connection | null = null;

export function getConnection(): Connection {
  if (!_conn) {
    _conn = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
  }
  return _conn;
}
