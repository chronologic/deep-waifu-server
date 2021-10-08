import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

import { PAYMENT_PROGRAM_ID, SOLANA_ENV, WALLET_PK } from './env';
import paymentIdl from './idl/deep_waifu_payment_contract.json';

export const connection = new web3.Connection(web3.clusterApiUrl(SOLANA_ENV), 'confirmed');

export const paymentPubkey = new web3.PublicKey(PAYMENT_PROGRAM_ID);

export const walletKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

export const wallet = new anchor.Wallet(walletKeyPair);

console.log(`Using wallet ${wallet.publicKey.toBase58()}`);

export const provider = new anchor.Provider(connection, wallet, {
  preflightCommitment: 'confirmed',
});

export const paymentProgram = new anchor.Program(paymentIdl as any, paymentPubkey, provider);

export async function getPaymentProgramPdaAddress() {
  return web3.PublicKey.findProgramAddress(
    [Buffer.from(anchor.utils.bytes.utf8.encode('payment-storage'))],
    paymentPubkey
  );
}
