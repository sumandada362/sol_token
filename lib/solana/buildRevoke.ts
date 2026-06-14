import { PublicKey, Transaction } from "@solana/web3.js";
import { createSetAuthorityInstruction, AuthorityType, getMint } from "@solana/spl-token";
import { updateV1, fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, createNoopSigner, signerIdentity } from "@metaplex-foundation/umi";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { getConnection } from "./connection";
import { assertSimulates } from "./simulate";
import { getUmi } from "./umi";
import { getMintProgramId } from "./program";
import { feeIx, FEES } from "./fees";
import type { RevokeInput } from "./validate";

// System program address — owning no private key, it can never sign an update.
export const REVOKED_UPDATE_AUTHORITY = "11111111111111111111111111111111";

export async function buildRevokeTx(input: RevokeInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mint);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  if (input.type === "mint") {
    const programId = await getMintProgramId(connection, mint);
    const mintInfo = await getMint(connection, mint, "confirmed", programId);
    if (!mintInfo.mintAuthority || mintInfo.mintAuthority.toBase58() !== payer.toBase58()) {
      throw new Error("Caller is not the mint authority");
    }
    tx.add(createSetAuthorityInstruction(mint, payer, AuthorityType.MintTokens, null, [], programId));
    const fee = feeIx(payer, FEES.revokeMint);
    if (fee) tx.add(fee);

  } else if (input.type === "freeze") {
    const programId = await getMintProgramId(connection, mint);
    const mintInfo = await getMint(connection, mint, "confirmed", programId);
    if (!mintInfo.freezeAuthority || mintInfo.freezeAuthority.toBase58() !== payer.toBase58()) {
      throw new Error("Caller is not the freeze authority");
    }
    tx.add(createSetAuthorityInstruction(mint, payer, AuthorityType.FreezeAccount, null, [], programId));
    const fee = feeIx(payer, FEES.revokeFreeze);
    if (fee) tx.add(fee);

  } else if (input.type === "update") {
    const umi = getUmi();
    const payerSigner = createNoopSigner(umiPublicKey(input.payer));
    umi.use(signerIdentity(payerSigner));

    const metadata = await fetchMetadataFromSeeds(umi, { mint: umiPublicKey(input.mint) });
    if (metadata.updateAuthority !== input.payer) {
      throw new Error("Caller is not the update authority");
    }
    if (!metadata.isMutable) {
      throw new Error("Token metadata is already immutable");
    }

    const builder = updateV1(umi, {
      mint: umiPublicKey(input.mint),
      authority: payerSigner,
      isMutable: false,
    });

    tx.add(...builder.getInstructions().map(toWeb3JsInstruction));
    // make-immutable is free — no fee instruction needed

  } else if (input.type === "updateAuthority") {
    const umi = getUmi();
    const payerSigner = createNoopSigner(umiPublicKey(input.payer));
    umi.use(signerIdentity(payerSigner));

    const metadata = await fetchMetadataFromSeeds(umi, { mint: umiPublicKey(input.mint) });
    if (metadata.updateAuthority !== input.payer) {
      throw new Error("Caller is not the update authority");
    }
    if (!metadata.isMutable) {
      throw new Error("Token metadata is immutable — the update authority can no longer be changed");
    }

    // Metaplex metadata has no null update authority — transferring it to the
    // system program is the standard way to revoke it (no one can sign as it).
    const builder = updateV1(umi, {
      mint: umiPublicKey(input.mint),
      authority: payerSigner,
      newUpdateAuthority: umiPublicKey(REVOKED_UPDATE_AUTHORITY),
    });

    tx.add(...builder.getInstructions().map(toWeb3JsInstruction));
    const fee = feeIx(payer, FEES.revokeUpdate);
    if (fee) tx.add(fee);
  }

  await assertSimulates(connection, tx, "revoke");
  return tx;
}
