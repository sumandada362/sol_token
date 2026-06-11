import { NextResponse } from "next/server";
import { z } from "zod";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { buildSubscribeTx, SUBSCRIPTION_SOL } from "@/lib/solana/buildSubscribe";
import { query } from "@/lib/db/postgres";

const pubkey = z.string().refine(
  (v) => { try { new PublicKey(v); return true; } catch { return false; } },
  { message: "Invalid Solana public key" }
);

const buildSchema = z.object({
  payer: pubkey,
  mint: pubkey,
});

const confirmSchema = z.object({
  signature: z.string().min(1),
  payer: pubkey,
  mint: pubkey,
});

// POST /api/tx/subscribe — build the subscribe transaction
export async function POST(req: Request) {
  const url = new URL(req.url);

  if (url.searchParams.get("action") === "confirm") {
    return handleConfirm(req);
  }

  try {
    const body = buildSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const tx = await buildSubscribeTx(body.data);
    const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
    const lastValidBlockHeight = (tx as { lastValidBlockHeight?: number }).lastValidBlockHeight ?? 0;

    return NextResponse.json({ tx: serialized, lastValidBlockHeight });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handleConfirm(req: Request) {
  try {
    const body = confirmSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { signature, payer, mint } = body.data;
    const conn = new Connection(process.env.SOLANA_RPC_URL!, "confirmed");

    const txInfo = await conn.getTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });

    if (!txInfo || txInfo.meta?.err) {
      return NextResponse.json({ error: "Transaction not confirmed or failed" }, { status: 400 });
    }

    // Verify: fee wallet received ≥0.5 SOL
    const feeWallet = new PublicKey(process.env.FEE_WALLET_ADDRESS!);
    const keys = txInfo.transaction.message.staticAccountKeys ?? [];
    const feeIdx = keys.findIndex((k) => k.toBase58() === feeWallet.toBase58());
    const pre = txInfo.meta?.preBalances ?? [];
    const post = txInfo.meta?.postBalances ?? [];

    if (feeIdx === -1 || post[feeIdx] - pre[feeIdx] < Math.round(SUBSCRIPTION_SOL * LAMPORTS_PER_SOL * 0.99)) {
      return NextResponse.json({ error: "Insufficient payment detected" }, { status: 400 });
    }

    // Verify memo contains "sub:<mint>"
    const logMessages = txInfo.meta?.logMessages ?? [];
    const memoLog = logMessages.find((m) => m.includes(`sub:${mint}`));
    if (!memoLog) {
      return NextResponse.json({ error: "Memo mismatch — sub:<mint> not found" }, { status: 400 });
    }

    // Upsert subscription — idempotent on paid_signature
    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    await query(
      `INSERT INTO subscriptions (mint, wallet, paid_signature, starts_at, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (paid_signature) DO NOTHING`,
      [mint, payer, signature, startsAt.toISOString(), expiresAt.toISOString()]
    );

    // Register Helius webhook for this mint
    await registerHeliusWebhook(mint);

    return NextResponse.json({ ok: true, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function registerHeliusWebhook(mint: string) {
  const apiKey = process.env.HELIUS_API_KEY;
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/helius`;
  const authSecret = process.env.WEBHOOK_AUTH_SECRET;
  if (!apiKey || !webhookUrl || !authSecret) return;

  try {
    await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookURL: webhookUrl,
        transactionTypes: ["SWAP", "TRANSFER"],
        accountAddresses: [mint],
        webhookType: "enhanced",
        authHeader: authSecret,
      }),
    });
  } catch {
    // Non-fatal — data will backfill on next Birdeye pull
  }
}
