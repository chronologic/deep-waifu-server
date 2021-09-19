import { Keypair } from '@solana/web3.js';

import { SOLANA_ENV } from '../env';
import { initializeConfig, initConfigLines, addConfigLine } from '../methods';
import { IManifest } from '../types';

export default async function main({
  walletKeyPair,
  manifest,
  env = SOLANA_ENV,
  items = 10,
}: {
  walletKeyPair: Keypair;
  manifest: IManifest;
  env?: string;
  items?: number;
}) {
  const res = await initializeConfig({
    walletKeyPair,
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
