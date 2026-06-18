import { PublicKey, Transaction } from "@solana/web3.js";
import { updateV1, fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, createNoopSigner, signerIdentity } from "@metaplex-foundation/umi";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { getConnection } from "./connection";
import { leaseRpc } from "./rpcPool";
import { assertSimulates } from "./simulate";
import { getUmi } from "./umi";
import { feeIx, FEES } from "./fees";
import type { UpdateMetadataInput } from "./validate";

export async function buildUpdateMetadataTx(input: UpdateMetadataInput): Promise<Transaction> {
  // One RPC for the whole transaction — connection + Umi share the same tag.
  const { tag } = leaseRpc();
  const connection = getConnection(tag);
  const payer = new PublicKey(input.payer);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

  const umi = getUmi(tag);
  const payerSigner = createNoopSigner(umiPublicKey(input.payer));
  umi.use(signerIdentity(payerSigner));

  const metadata = await fetchMetadataFromSeeds(umi, { mint: umiPublicKey(input.mint) });
  if (metadata.updateAuthority !== input.payer) {
    throw new Error("Caller is not the update authority");
  }
  if (!metadata.isMutable) {
    throw new Error("Token metadata is immutable — it can no longer be updated");
  }

  const builder = updateV1(umi, {
    mint: umiPublicKey(input.mint),
    authority: payerSigner,
    data: {
      name: input.name,
      symbol: input.symbol,
      uri: input.uri || metadata.uri,
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      creators: metadata.creators,
    },
  });

  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });
  tx.add(...builder.getInstructions().map(toWeb3JsInstruction));
  const fee = feeIx(payer, FEES.updateMetadata);
  if (fee) tx.add(fee);

  await assertSimulates(connection, tx, "update-metadata");
  return tx;
}
