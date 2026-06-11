import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { query } from "@/lib/db/postgres";
import { cacheSet, cacheDel, CACHE_KEYS } from "@/lib/db/redis";

const schema = z.object({
  signature: z.string().min(1),
  action: z.enum(["createToken", "mintMore", "updateMetadata", "revokeMint", "revokeFreeze", "makeImmutable", "burn"]),
  mint: z.string().optional(),
  wallet: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  metadataUri: z.string().optional(),
  standard: z.enum(["spl", "token2022"]).optional(),
  feePaidLamports: z.number().int().nonnegative().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { signature, action, mint, wallet, name, symbol, metadataUri, standard, feePaidLamports } = body.data;

    // Verify the transaction actually landed on-chain before trusting any client claim
    const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
    const txInfo = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txInfo || txInfo.meta?.err) {
      return NextResponse.json({ error: "Transaction not confirmed or failed" }, { status: 400 });
    }

    // Verify the fee wallet received its payment (for paid actions)
    const PAID_ACTIONS = ["createToken", "mintMore", "updateMetadata", "revokeMint", "revokeFreeze"];
    if (PAID_ACTIONS.includes(action) && process.env.FEE_WALLET_ADDRESS) {
      const feeWallet = new PublicKey(process.env.FEE_WALLET_ADDRESS);
      const feeWalletIndex = txInfo.transaction.message.staticAccountKeys?.findIndex(
        (k) => k.toBase58() === feeWallet.toBase58()
      );
      const postBalances = txInfo.meta?.postBalances ?? [];
      const preBalances = txInfo.meta?.preBalances ?? [];
      if (
        feeWalletIndex === undefined ||
        feeWalletIndex === -1 ||
        postBalances[feeWalletIndex] <= preBalances[feeWalletIndex]
      ) {
        return NextResponse.json({ error: "Fee payment not detected" }, { status: 400 });
      }
    }

    // --- Postgres writes ---

    // fee_events — unique on signature so duplicate confirms are idempotent
    await query(
      `INSERT INTO fee_events (wallet, action, lamports, signature, mint)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (signature) DO NOTHING`,
      [wallet, action, feePaidLamports ?? 0, signature, mint ?? null]
    );

    // tokens — only on createToken
    if (action === "createToken" && mint) {
      const tokenRow = {
        mint,
        creator_wallet: wallet,
        name: name ?? null,
        symbol: symbol ?? null,
        metadata_uri: metadataUri ?? null,
        standard: standard ?? "spl",
        fee_paid_lamports: feePaidLamports ?? 0,
        tx_signature: signature,
      };

      await query(
        `INSERT INTO tokens
           (mint, creator_wallet, name, symbol, metadata_uri, standard, fee_paid_lamports, tx_signature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (mint) DO NOTHING`,
        Object.values(tokenRow)
      );

      // Prime the Redis cache immediately — avoid a cold read on the dashboard
      await cacheSet(CACHE_KEYS.token(mint), tokenRow);
      // Invalidate the wallet token list so it refreshes on next read
      await cacheDel(CACHE_KEYS.walletTokens(wallet));
    }

    // For metadata/authority updates, invalidate the stale cache entry
    if (["updateMetadata", "revokeMint", "revokeFreeze", "makeImmutable"].includes(action) && mint) {
      await cacheDel(CACHE_KEYS.token(mint));
    }

    return NextResponse.json({ ok: true, signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
