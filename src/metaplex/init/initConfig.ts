import fs from 'fs';
import { Keypair } from '@solana/web3.js';

import { CREATOR_ADDRESS, SOLANA_ENV, WALLET_PK } from '../env';
import { initializeConfig, initConfigLines } from '../methods';
import { IManifest } from '../types';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

const manifest: IManifest = {
  name: 'First',
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

const image = fs.readFileSync('./images/hug.png');

export default async function main({ items = 10 } = {}) {
  const res = await initializeConfig({
    maxItems: items,
    env: SOLANA_ENV,
    walletKeyPair,
    manifest,
    image,
  });

  console.log(res);

  await initConfigLines({
    walletKeyPair,
    env: SOLANA_ENV,
    count: items,
    configAddress: res.configAddress,
  });

  return res;
}

// main();
