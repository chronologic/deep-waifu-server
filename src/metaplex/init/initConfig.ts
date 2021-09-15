import { Keypair } from '@solana/web3.js';

import { SOLANA_ENV } from '../env';
import { initializeConfig, initConfigLines } from '../methods';
import { IManifest } from '../types';

export default async function main({
  walletKeyPair,
  image,
  manifest,
  env = SOLANA_ENV,
  items = 10,
}: {
  walletKeyPair: Keypair;
  image: Buffer;
  manifest: IManifest;
  env?: string;
  items?: number;
}) {
  const res = await initializeConfig({
    walletKeyPair,
    image,
    manifest,
    env,
    maxItems: items,
  });

  console.log(res);

  await initConfigLines({
    walletKeyPair,
    env,
    count: items,
    configAddress: res.configAddress,
  });

  return res;
}

// main();
