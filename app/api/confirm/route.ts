import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { z } from "zod";

const schema = z.object({
  signature: z.string().min(1),
  action: z.enum(["createToken", "mintMore", "updateMetadata", "revokeMint", "revokeFreeze", "makeImmutable", "burn"]),
  mint: z.string().optional(),
  wallet: z.string(),
  name: z.string().optional(),
  symbol: z.string().optional(),
  metadataUri: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { signature, action, mint, wallet, name, symbol, metadataUri } = body.data;

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

    // TODO: write to DB here once DATABASE_URL is configured
    // await db.query("INSERT INTO fee_events (wallet, action, signature) VALUES ($1, $2, $3)", [wallet, action, signature]);
    // if (action === "createToken" && mint) {
    //   await db.query("INSERT INTO tokens (mint, creator_wallet, name, symbol, metadata_uri, tx_signature) VALUES (...)", [...]);
    // }

    return NextResponse.json({ ok: true, signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
