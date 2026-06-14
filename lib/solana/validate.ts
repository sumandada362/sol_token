import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

const pubkey = z.string().refine(
  (val) => { try { new PublicKey(val); return true; } catch { return false; } },
  { message: "Invalid Solana public key" }
);

const httpsUrl = z.string().refine(
  (val) => val === "" || val.startsWith("https://"),
  { message: "Must be empty or a valid HTTPS URL" }
);

export const burnSchema = z.object({
  payer: pubkey,
  mint: pubkey,
  tokenAccount: pubkey,
  amount: z.string().regex(/^\d+$/, "Must be a non-negative integer"),
  decimals: z.number().int().min(0).max(9),
});

export const mintMoreSchema = z.object({
  payer: pubkey,
  mint: pubkey,
  destination: pubkey,
  amount: z.string().regex(/^\d+$/, "Must be a non-negative integer"),
  decimals: z.number().int().min(0).max(9),
});

export const revokeSchema = z.object({
  payer: pubkey,
  mint: pubkey,
  type: z.enum(["mint", "freeze", "update", "updateAuthority"]),
});

export const updateMetadataSchema = z.object({
  payer: pubkey,
  mint: pubkey,
  name: z.string().min(1).max(30),
  symbol: z.string().min(1).max(10),
  uri: httpsUrl,
});

// SPL token amounts are u64 — supply × 10^decimals must fit or the signed tx fails on-chain
const U64_MAX = BigInt("18446744073709551615");

export const createTokenSchema = z.object({
  payer: pubkey,
  mintPublicKey: pubkey,
  name: z.string().min(1).max(30),
  symbol: z.string().min(1).max(10),
  supply: z.string().regex(/^\d+$/, "Must be a positive integer"),
  decimals: z.number().int().min(0).max(9),
  metadataUri: httpsUrl,
  standard: z.enum(["spl", "token2022"]),
  revokeMint: z.boolean(),
  revokeFreeze: z.boolean(),
  revokeUpdate: z.boolean(),
  revokeUpdateAuthority: z.boolean().default(false),
  customCreator: z.boolean(),
}).refine(
  (d) => {
    try {
      const raw = BigInt(d.supply) * BigInt(10) ** BigInt(d.decimals);
      return raw > BigInt(0) && raw <= U64_MAX;
    } catch {
      return false;
    }
  },
  { message: "Supply × 10^decimals must be between 1 and 2^64-1", path: ["supply"] }
);

export type BurnInput = z.infer<typeof burnSchema>;
export type MintMoreInput = z.infer<typeof mintMoreSchema>;
export type RevokeInput = z.infer<typeof revokeSchema>;
export type UpdateMetadataInput = z.infer<typeof updateMetadataSchema>;
export type CreateTokenInput = z.infer<typeof createTokenSchema>;
