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
  type: z.enum(["mint", "freeze", "update"]),
});

export const updateMetadataSchema = z.object({
  payer: pubkey,
  mint: pubkey,
  name: z.string().min(1).max(30),
  symbol: z.string().min(1).max(10),
  uri: httpsUrl,
});

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
});

export type BurnInput = z.infer<typeof burnSchema>;
export type MintMoreInput = z.infer<typeof mintMoreSchema>;
export type RevokeInput = z.infer<typeof revokeSchema>;
export type UpdateMetadataInput = z.infer<typeof updateMetadataSchema>;
export type CreateTokenInput = z.infer<typeof createTokenSchema>;
