import { PublicKey, Transaction } from "@solana/web3.js";
import { createSetAuthorityInstruction, AuthorityType, getMint } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, updateV1, fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, createNoopSigner, signerIdentity } from "@metaplex-foundation/umi";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { getConnection } from "./connection";
import { feeIx, FEES } from "./fees";
import type { RevokeInput } from "./validate";

export async function buildRevokeTx(input: RevokeInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mint);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  if (input.type === "mint") {
    const mintInfo = await getMint(connection, mint);
    if (!mintInfo.mintAuthority || mintInfo.mintAuthority.toBase58() !== payer.toBase58()) {
      throw new Error("Caller is not the mint authority");
    }
    tx.add(createSetAuthorityInstruction(mint, payer, AuthorityType.MintTokens, null));
    const fee = feeIx(payer, FEES.revokeMint);
    if (fee) tx.add(fee);

  } else if (input.type === "freeze") {
    const mintInfo = await getMint(connection, mint);
    if (!mintInfo.freezeAuthority || mintInfo.freezeAuthority.toBase58() !== payer.toBase58()) {
      throw new Error("Caller is not the freeze authority");
    }
    tx.add(createSetAuthorityInstruction(mint, payer, AuthorityType.FreezeAccount, null));
    const fee = feeIx(payer, FEES.revokeFreeze);
    if (fee) tx.add(fee);

  } else if (input.type === "update") {
    const umi = createUmi(process.env.SOLANA_RPC_URL!).use(mplTokenMetadata());
    const payerSigner = createNoopSigner(umiPublicKey(input.payer));
    umi.use(signerIdentity(payerSigner));

    const metadata = await fetchMetadataFromSeeds(umi, { mint: umiPublicKey(input.mint) });
    if (metadata.updateAuthority !== input.payer) {
      throw new Error("Caller is not the update authority");
    }

    const builder = updateV1(umi, {
      mint: umiPublicKey(input.mint),
      authority: payerSigner,
      isMutable: false,
    });

    tx.add(...builder.getInstructions().map(toWeb3JsInstruction));
    // make-immutable is free — no fee instruction needed
  }

  return tx;
}
