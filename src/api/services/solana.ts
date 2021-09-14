import web3 from '@solana/web3.js';
import anchor from '@project-serum/anchor';

import { PAYMENT_PROGRAM_ID, SOLANA_ENV } from '../../env';
import paymentIdl from '../../idl/deep_waifu_payment_contract.json';

export function createConnection() {
  return new web3.Connection(web3.clusterApiUrl(SOLANA_ENV), 'confirmed');
}

export const paymentPubkey = new anchor.web3.PublicKey(PAYMENT_PROGRAM_ID);

export const paymentProgram = new anchor.Program(paymentIdl as any, paymentPubkey);

export async function getPaymentProgramPdaAddress() {
  return web3.PublicKey.findProgramAddress(
    [Buffer.from(anchor.utils.bytes.utf8.encode('payment-storage'))],
    paymentPubkey
  );
}
