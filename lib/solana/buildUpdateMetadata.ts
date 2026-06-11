import { PublicKey, Transaction } from "@solana/web3.js";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, updateV1, fetchMetadataFromSeeds } from "@metaplex-foundation/mpl-token-metadata";
import { publicKey as umiPublicKey, createNoopSigner, signerIdentity } from "@metaplex-foundation/umi";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { getConnection } from "./connection";
import { feeIx, FEES } from "./fees";
import type { UpdateMetadataInput } from "./validate";

export async function buildUpdateMetadataTx(input: UpdateMetadataInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

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

  return tx;
}
