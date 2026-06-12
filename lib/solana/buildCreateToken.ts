import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getAssociatedTokenAddressSync,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
} from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { mplTokenMetadata, createV1, TokenStandard } from "@metaplex-foundation/mpl-token-metadata";
import {
  publicKey as umiPublicKey,
  createNoopSigner,
  signerIdentity,
  percentAmount,
  none,
} from "@metaplex-foundation/umi";
import { toWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { getConnection } from "./connection";
import { feeIx, FEES } from "./fees";
import type { CreateTokenInput } from "./validate";

const TOKEN_2022_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export async function buildCreateTokenTx(input: CreateTokenInput): Promise<Transaction> {
  const connection = getConnection();
  const payer = new PublicKey(input.payer);
  const mint = new PublicKey(input.mintPublicKey);

  const isToken2022 = input.standard === "token2022";
  const tokenProgramId = isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

  // Rent-exempt lamports for the mint account
  const mintLen = isToken2022 ? getMintLen([]) : MINT_SIZE;
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  const ata = getAssociatedTokenAddressSync(mint, payer, false, tokenProgramId);
  const supply = BigInt(input.supply) * BigInt(10 ** input.decimals);

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  const tx = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer });

  // 1. Create and fund mint account (mint keypair must sign — client does partialSign)
  tx.add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: tokenProgramId,
    })
  );

  // 2. Initialize mint (authorities = payer/wallet)
  tx.add(createInitializeMintInstruction(mint, input.decimals, payer, payer, tokenProgramId));

  // 3. Create payer's associated token account
  tx.add(createAssociatedTokenAccountInstruction(payer, ata, payer, mint, tokenProgramId));

  // 4. Mint full supply to payer
  tx.add(createMintToInstruction(mint, ata, payer, supply, [], tokenProgramId));

  // 5. Metaplex metadata — pass mint as publicKey (non-signer) so createV1 only makes metadata
  const umi = createUmi(process.env.SOLANA_RPC_URL!).use(mplTokenMetadata());
  const payerSigner = createNoopSigner(umiPublicKey(input.payer));
  umi.use(signerIdentity(payerSigner));

  const metadataBuilder = createV1(umi, {
    mint: umiPublicKey(input.mintPublicKey),
    authority: payerSigner,
    payer: payerSigner,
    name: input.name,
    symbol: input.symbol,
    uri: input.metadataUri,
    sellerFeeBasisPoints: percentAmount(0),
    tokenStandard: TokenStandard.Fungible,
    isMutable: !input.revokeUpdate,
    // Custom creator info: embed the payer as the verified on-chain creator
    // (payer signs the tx, so on-chain verification succeeds)
    creators: input.customCreator
      ? [{ address: umiPublicKey(input.payer), verified: true, share: 100 }]
      : none(),
    ...(isToken2022 ? { splTokenProgram: umiPublicKey(TOKEN_2022_ID) } : {}),
  });

  tx.add(...metadataBuilder.getInstructions().map(toWeb3JsInstruction));

  // 6. Optional authority revocations
  if (input.revokeMint) {
    tx.add(createSetAuthorityInstruction(mint, payer, AuthorityType.MintTokens, null, [], tokenProgramId));
  }
  if (input.revokeFreeze) {
    tx.add(createSetAuthorityInstruction(mint, payer, AuthorityType.FreezeAccount, null, [], tokenProgramId));
  }

  // 7. Platform fee (atomic with the token creation)
  let totalFee = FEES.createToken;
  if (input.revokeMint) totalFee += FEES.revokeMint;
  if (input.revokeFreeze) totalFee += FEES.revokeFreeze;
  if (input.customCreator) totalFee += FEES.customCreator;
  const fee = feeIx(payer, totalFee);
  if (fee) tx.add(fee);

  return tx;
}
