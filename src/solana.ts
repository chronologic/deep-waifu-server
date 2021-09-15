import * as web3 from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';

import { PAYMENT_PROGRAM_ID, SOLANA_ENV, WALLET_PK } from './env';
import paymentIdl from './idl/deep_waifu_payment_contract.json';

export function createConnection() {
  return new web3.Connection(web3.clusterApiUrl(SOLANA_ENV), 'confirmed');
}

export const paymentPubkey = new web3.PublicKey(PAYMENT_PROGRAM_ID);

// TODO: get provider
export const paymentProgram = new anchor.Program(paymentIdl as any, paymentPubkey);

export async function getPaymentProgramPdaAddress() {
  return web3.PublicKey.findProgramAddress(
    [Buffer.from(anchor.utils.bytes.utf8.encode('payment-storage'))],
    paymentPubkey
  );
}

export const walletKeyPair = web3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));
