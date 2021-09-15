import fs from 'fs';
import { Keypair } from '@solana/web3.js';

import { CREATOR_ADDRESS, METAPLEX_CONFIG_ADDRESS, METAPLEX_CONFIG_UUID, SOLANA_ENV, WALLET_PK } from '../env';
import { uploadImageAndAddConfigLine, mintOneToken } from '../methods';
import { IManifest } from '../types';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

const manifest: IManifest = {
  name: 'Crazy',
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

const image = fs.readFileSync('./images/crazy.png');

// console.log(image);

async function main() {
  const res = await uploadImageAndAddConfigLine({
    env: SOLANA_ENV,
    walletKeyPair,
    manifest,
    image,
    index: 1,
    configAddress: METAPLEX_CONFIG_ADDRESS,
  });

  console.log(res);

  const mintRes = await mintOneToken({
    walletKeyPair,
    env: SOLANA_ENV,
    configAddress: METAPLEX_CONFIG_ADDRESS,
    configUuid: METAPLEX_CONFIG_UUID,
    // mintToAddress: 'H4KjYiFDqUc45on7cFLofPG8uNDShNX5rhLxTpeb69cm',
    mintToAddress: 'H4KjYiFDqUc45on7cFLofPG8uNDShNX5rhLxTpeb69cm',
  });

  console.log(mintRes);
}
