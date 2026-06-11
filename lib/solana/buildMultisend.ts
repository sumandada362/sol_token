import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getConnection } from "./connection";
import { feeIx } from "./fees";
import crypto from "crypto";

export const MULTISEND_FEE_PER_RECIPIENT = 0.001;
export const MULTISEND_MIN_FEE = 0.02;
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
 * Platform fee is spread pro-rata across batches.
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

  // Derive all ATAs and check existence in parallel
  const atas = recipients.map((r) =>
    getAssociatedTokenAddressSync(mintPk, new PublicKey(r.address), false, TOKEN_PROGRAM_ID)
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

  // Platform fee
  const platformFeeSol = Math.max(MULTISEND_MIN_FEE, recipients.length * MULTISEND_FEE_PER_RECIPIENT);
  const platformFeeLamperRecipient = Math.ceil((platformFeeSol * LAMPORTS_PER_SOL) / Math.ceil(recipients.length / INSTRUCTIONS_PER_BATCH));

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

      // Pro-rata platform fee on every batch
      const feeInstruction = feeIx(payerPk, platformFeeLamperRecipient / LAMPORTS_PER_SOL);
      if (feeInstruction) tx.add(feeInstruction);

      for (const r of chunk) {
        const recipientPk = new PublicKey(r.address);
        const ata = getAssociatedTokenAddressSync(mintPk, recipientPk, false, TOKEN_PROGRAM_ID);

        if (!existsMap.get(ata.toBase58())) {
          tx.add(createAssociatedTokenAccountInstruction(payerPk, ata, recipientPk, mintPk));
        }

        tx.add(
          createTransferCheckedInstruction(
            getAssociatedTokenAddressSync(mintPk, payerPk, false, TOKEN_PROGRAM_ID),
            mintPk,
            ata,
            payerPk,
            BigInt(r.amount),
            decimals
          )
        );
      }

      const serialized = tx.serialize({ requireAllSignatures: false }).toString("base64");
      return {
        index: batchIdx,
        tx: serialized,
        lastValidBlockHeight,
        recipientCount: chunk.length,
        platformFeeLamports: platformFeeLamperRecipient,
      };
    })
  );

  const quote: MultisendQuote = {
    platformFeeSol,
    ataRentSol: (ataCreations * ATA_RENT_LAMPORTS) / LAMPORTS_PER_SOL,
    networkFeeSol: Math.max(0.001, batches.length * 0.000005),
    totalSol: platformFeeSol + (ataCreations * ATA_RENT_LAMPORTS) / LAMPORTS_PER_SOL + Math.max(0.001, batches.length * 0.000005),
    ataCreations,
    recipientCount: recipients.length,
  };

  return { uploadHash, batches, quote };
}

/**
 * Validates a recipient list (pure function — also run client-side).
 * Returns errors indexed by row number.
 */
export function validateRecipients(
  rows: Array<{ address: string; amount: string }>,
  decimals: number
): Map<number, string> {
  const errors = new Map<number, string>();
  const seen = new Set<string>();
  const maxUnits = BigInt(10) ** BigInt(decimals);

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

    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) { errors.set(i, "Amount must be positive"); continue; }

    // Check decimal precision
    const parts = amount.split(".");
    if (parts[1] && parts[1].length > decimals) {
      errors.set(i, `Exceeds ${decimals} decimal places`);
      continue;
    }

    // Check overflow (raw units > u64 max is caught by BigInt parse)
    const rawUnits = BigInt(Math.round(amtNum * Number(maxUnits)));
    if (rawUnits <= BigInt(0)) { errors.set(i, "Amount rounds to zero"); continue; }
  }
  return errors;
}

/** Convert human amount string to raw units string */
export function toRawUnits(amount: string, decimals: number): string {
  const factor = 10 ** decimals;
  return String(Math.round(parseFloat(amount) * factor));
}
