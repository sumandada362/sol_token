import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { getConnection } from "./connection";
import { getMintProgramId } from "./program";
import { feeIx } from "./fees";
import crypto from "crypto";

export const MULTISEND_FEE_PER_TX = 0.02;
const INSTRUCTIONS_PER_BATCH = 8; // conservative — ATA creations are larger

export interface Recipient {
  address: string;
  amount: string; // raw units (adjusted for decimals) as a string
}

export interface MultisendBatch {
  index: number;
  tx: string; // base64 serialized
  lastValidBlockHeight: number;
  recipientCount: number;
  platformFeeLamports: number;
}

export interface MultisendQuote {
  platformFeeSol: number;
  ataRentSol: number;
  networkFeeSol: number;
  totalSol: number;
  ataCreations: number;
  recipientCount: number;
}

export interface MultisendResult {
  uploadHash: string;
  batches: MultisendBatch[];
  quote: MultisendQuote;
}

/**
 * Builds batched multisend transactions.
 * Checks which recipient ATAs already exist to include accurate rent cost.
 * Each batch carries the flat per-transaction platform fee.
 */
export async function buildMultisendTxs(
  payer: string,
  mint: string,
  decimals: number,
  recipients: Recipient[]
): Promise<MultisendResult> {
  const conn = getConnection();
  const payerPk = new PublicKey(payer);
  const mintPk = new PublicKey(mint);
  const programId = await getMintProgramId(conn, mintPk);

  // Derive all ATAs and check existence in parallel
  const atas = recipients.map((r) =>
    getAssociatedTokenAddressSync(mintPk, new PublicKey(r.address), false, programId)
  );

  // Check in batches of 100 (getMultipleAccounts limit)
  const existsMap = new Map<string, boolean>();
  for (let i = 0; i < atas.length; i += 100) {
    const slice = atas.slice(i, i + 100);
    const infos = await conn.getMultipleAccountsInfo(slice, "confirmed");
    infos.forEach((info, j) => {
      existsMap.set(atas[i + j].toBase58(), info !== null);
    });
  }

  const ataCreations = [...existsMap.values()].filter((v) => !v).length;
  const ATA_RENT_LAMPORTS = 2_039_280; // ~0.002 SOL

  // Platform fee — flat per transaction batch
  const batchCount = Math.ceil(recipients.length / INSTRUCTIONS_PER_BATCH);
  const platformFeeSol = batchCount * MULTISEND_FEE_PER_TX;
  const platformFeeLamportsPerBatch = Math.round(MULTISEND_FEE_PER_TX * LAMPORTS_PER_SOL);

  // Upload hash for journal keying
  const uploadHash = crypto
    .createHash("sha256")
    .update(`${mint}:${payer}:${recipients.map((r) => `${r.address}:${r.amount}`).join(",")}`)
    .digest("hex")
    .slice(0, 16);

  // Split into batches
  const chunks: Recipient[][] = [];
  for (let i = 0; i < recipients.length; i += INSTRUCTIONS_PER_BATCH) {
    chunks.push(recipients.slice(i, i + INSTRUCTIONS_PER_BATCH));
  }

  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");

  const batches: MultisendBatch[] = await Promise.all(
    chunks.map(async (chunk, batchIdx) => {
      const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payerPk });

      // Flat platform fee on every batch
      const feeInstruction = feeIx(payerPk, MULTISEND_FEE_PER_TX);
      if (feeInstruction) tx.add(feeInstruction);

      for (const r of chunk) {
        const recipientPk = new PublicKey(r.address);
        const ata = getAssociatedTokenAddressSync(mintPk, recipientPk, false, programId);

        if (!existsMap.get(ata.toBase58())) {
          // Idempotent: a no-op if the ATA appears between quote and send
          tx.add(
            createAssociatedTokenAccountIdempotentInstruction(payerPk, ata, recipientPk, mintPk, programId)
          );
        }

        tx.add(
          createTransferCheckedInstruction(
            getAssociatedTokenAddressSync(mintPk, payerPk, false, programId),
            mintPk,
            ata,
            payerPk,
            BigInt(r.amount),
            decimals,
            [],
            programId
          )
        );
      }

      const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
      return {
        index: batchIdx,
        tx: serialized,
        lastValidBlockHeight,
        recipientCount: chunk.length,
        platformFeeLamports: platformFeeLamportsPerBatch,
      };
    })
  );

  const networkFeeSol = batches.length * 0.000005;
  const quote: MultisendQuote = {
    platformFeeSol,
    ataRentSol: (ataCreations * ATA_RENT_LAMPORTS) / LAMPORTS_PER_SOL,
    networkFeeSol,
    totalSol: platformFeeSol + (ataCreations * ATA_RENT_LAMPORTS) / LAMPORTS_PER_SOL + networkFeeSol,
    ataCreations,
    recipientCount: recipients.length,
  };

  return { uploadHash, batches, quote };
}

/**
 * Validates a recipient list (pure function — also run client-side).
 * Returns errors indexed by row number.
 */
const U64_MAX = BigInt("18446744073709551615");

export function validateRecipients(
  rows: Array<{ address: string; amount: string }>,
  decimals: number
): Map<number, string> {
  const errors = new Map<number, string>();
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const { address, amount } = rows[i];
    try {
      new PublicKey(address);
    } catch {
      errors.set(i, "Invalid public key");
      continue;
    }
    if (seen.has(address)) { errors.set(i, "Duplicate address"); continue; }
    seen.add(address);

    if (!/^\d+(\.\d+)?$/.test(amount.trim())) { errors.set(i, "Amount must be positive"); continue; }

    // Check decimal precision
    const parts = amount.trim().split(".");
    if (parts[1] && parts[1].length > decimals) {
      errors.set(i, `Exceeds ${decimals} decimal places`);
      continue;
    }

    const rawUnits = BigInt(toRawUnits(amount, decimals));
    if (rawUnits <= BigInt(0)) { errors.set(i, "Amount rounds to zero"); continue; }
    if (rawUnits > U64_MAX) { errors.set(i, "Amount exceeds the maximum token supply"); continue; }
  }
  return errors;
}

/**
 * Convert a human decimal amount string to raw units, exactly.
 * Pure string/BigInt math — parseFloat loses precision above 2^53 raw units,
 * which silently corrupts large airdrops.
 */
export function toRawUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.trim().split(".");
  const fracPadded = frac.slice(0, decimals).padEnd(decimals, "0");
  return (BigInt(whole || "0") * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded || "0")).toString();
}
