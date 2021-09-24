import fs from 'fs';
import { Keypair } from '@solana/web3.js';

import { CREATOR_ADDRESS, SOLANA_ENV, WALLET_PK } from '../env';
import { uploadWithCert } from '../methods';
import { IManifest } from '../types';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

const manifest: IManifest = {
  name: `${Math.random()}`,
  symbol: 'TST',
  description: 'This is a test',
  seller_fee_basis_points: 500,
  collection: {
    family: 'Test NFTs',
    name: 'Test',
  },
  certificate: 'cert.png',
  image: 'image.png',
  properties: {
    creators: [{ address: CREATOR_ADDRESS, share: 100, verified: true }],
    files: [
      { uri: 'image.png', type: 'image/png', name: 'main' },
      { uri: 'cert.png', type: 'image/png', name: 'cert' },
    ],
  },
} as any;

// const image = fs.readFileSync('./images/five.png');
const image = fs.readFileSync('./images/anna.png');
const cert = fs.readFileSync('./images/cert.png');

async function main() {
  const res = await uploadWithCert({
    env: SOLANA_ENV,
    walletKeyPair,
    manifest,
    image,
    cert,
    index: 0,
  });

  console.log(res);
}

main();
