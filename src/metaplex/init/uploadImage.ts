import fs from 'fs';
import { Keypair } from '@solana/web3.js';

import { CREATOR_ADDRESS, SOLANA_ENV, WALLET_PK } from '../env';
import { uploadImagesAndManifest } from '../methods';
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
  image: 'image.png',
  properties: {
    creators: [{ address: CREATOR_ADDRESS, share: 100, verified: true }],
    files: [{ uri: 'image.png', type: 'image/png' }],
  },
};

// const image = fs.readFileSync('./images/five.png');
const image = fs.readFileSync('./images/anna.png');
const certificate = fs.readFileSync('./images/cert.png');

async function main() {
  const res = await uploadImagesAndManifest({
    env: SOLANA_ENV,
    walletKeyPair,
    manifest,
    image,
    certificate,
    index: 0,
  });

  console.log(res);
}

main();
