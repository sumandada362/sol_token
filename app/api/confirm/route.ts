import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { z } from "zod";
import { query } from "@/lib/db/postgres";
import { cacheSet, cacheDel, CACHE_KEYS } from "@/lib/db/redis";
import { FEES } from "@/lib/solana/fees";
import { rateLimit, rateLimitByKey, RATE_LIMITS } from "@/lib/rateLimit";
import { apiError } from "@/lib/api/errors";

const schema = z.object({
  signature: z.string().min(43).max(88),
  action: z.enum([
    "createToken",
    "mintMore",
    "updateMetadata",
    "revokeMint",
    "revokeFreeze",
    "makeImmutable",
    "burn",
    "freezeAccounts",
    "unfreezeAccounts",
  ]),
  mint: z.string().optional(),
  wallet: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  metadataUri: z.string().optional(),
  standard: z.enum(["spl", "token2022"]).optional(),
  count: z.number().int().positive().max(20).optional(),
});

// Minimum SOL that must arrive at the fee wallet for each paid action.
// Derived purely from server constants — never trusted from client input.
const MIN_FEE_LAMPORTS: Partial<Record<string, number>> = {
  createToken: Math.floor(FEES.createToken * LAMPORTS_PER_SOL),
  mintMore: Math.floor(FEES.mintMore * LAMPORTS_PER_SOL),
  updateMetadata: Math.floor(FEES.updateMetadata * LAMPORTS_PER_SOL),
  revokeMint: Math.floor(FEES.revokeMint * LAMPORTS_PER_SOL),
  revokeFreeze: Math.floor(FEES.revokeFreeze * LAMPORTS_PER_SOL),
  // makeImmutable and burn are free — no fee check needed
};

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, RATE_LIMITS.confirm);
  if (limited) return limited;

  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { signature, action, mint, wallet, name, symbol, metadataUri, standard, count } = body.data;

    const walletLimited = await rateLimitByKey(wallet, RATE_LIMITS.walletConfirm);
    if (walletLimited) return walletLimited;

    const connection = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");
    const txInfo = await connection.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txInfo || txInfo.meta?.err) {
      return NextResponse.json({ error: "Transaction not confirmed or failed" }, { status: 400 });
    }

    // Verify the fee wallet received the correct minimum amount for paid actions.
    // The expected amount comes from server constants only — count is the only client input used (× per-wallet fee).
    const minLamports =
      action === "freezeAccounts" || action === "unfreezeAccounts"
        ? Math.floor((count ?? 1) * FEES.freezeAccount * LAMPORTS_PER_SOL)
        : MIN_FEE_LAMPORTS[action];
    if (minLamports !== undefined && minLamports > 0 && process.env.FEE_WALLET_ADDRESS) {
      const feeWallet = new PublicKey(process.env.FEE_WALLET_ADDRESS);
      const keys = txInfo.transaction.message.staticAccountKeys;
      const feeWalletIndex = keys?.findIndex((k) => k.toBase58() === feeWallet.toBase58()) ?? -1;
      const postBalances = txInfo.meta?.postBalances ?? [];
      const preBalances = txInfo.meta?.preBalances ?? [];
      const received =
        feeWalletIndex >= 0
          ? (postBalances[feeWalletIndex] ?? 0) - (preBalances[feeWalletIndex] ?? 0)
          : 0;

      if (received < minLamports) {
        console.error(
          `[confirm] Fee shortfall for ${action}: expected ≥${minLamports} lamports, got ${received}. sig=${signature}`
        );
        return NextResponse.json({ error: "Fee payment insufficient" }, { status: 400 });
      }
    }

    // The actual lamports received (used only for record-keeping, never for verification)
    const feeWalletIdx = process.env.FEE_WALLET_ADDRESS
      ? (txInfo.transaction.message.staticAccountKeys?.findIndex(
          (k) => k.toBase58() === new PublicKey(process.env.FEE_WALLET_ADDRESS!).toBase58()
        ) ?? -1)
      : -1;
    const actualLamports =
      feeWalletIdx >= 0
        ? ((txInfo.meta?.postBalances?.[feeWalletIdx] ?? 0) -
            (txInfo.meta?.preBalances?.[feeWalletIdx] ?? 0))
        : 0;

    // --- Postgres writes ---

    // fee_events — unique on signature, duplicate confirms are idempotent
    await query(
      `INSERT INTO fee_events (wallet, action, lamports, signature, mint)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (signature) DO NOTHING`,
      [wallet, action, Math.max(actualLamports, 0), signature, mint ?? null]
    );

    if (action === "createToken" && mint) {
      const tokenRow = {
        mint,
        creator_wallet: wallet,
        name: name ?? null,
        symbol: symbol ?? null,
        metadata_uri: metadataUri ?? null,
        standard: standard ?? "spl",
        fee_paid_lamports: Math.max(actualLamports, 0),
        tx_signature: signature,
      };

      await query(
        `INSERT INTO tokens
           (mint, creator_wallet, name, symbol, metadata_uri, standard, fee_paid_lamports, tx_signature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (mint) DO NOTHING`,
        Object.values(tokenRow)
      );

      await cacheSet(CACHE_KEYS.token(mint), tokenRow);
      await cacheDel(CACHE_KEYS.walletTokens(wallet));
    }

    if (["updateMetadata", "revokeMint", "revokeFreeze", "makeImmutable"].includes(action) && mint) {
      await cacheDel(CACHE_KEYS.token(mint));
    }

    return NextResponse.json({ ok: true, signature });
  } catch (err) {
    return apiError(err, "confirm");
  }
}
