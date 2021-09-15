import { Keypair } from '@solana/web3.js';

import initConfig from './initConfig';
import createCandyMachine from './createCandyMachine';
import setStartDate from './setStartDate';
import { mintOneToken } from '../methods';
import { SOLANA_ENV } from '../env';
import { IManifest } from '../types';

export async function bootstrap({
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
  const initConfigRes = await initConfig({ items, image, manifest, walletKeyPair, env });
  const createCandyMachineRes = await createCandyMachine({
    items,
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
  });
  await setStartDate({
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
  });

  await mintOneToken({
    walletKeyPair,
    env: SOLANA_ENV,
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
    mintToAddress: walletKeyPair.publicKey.toBase58(),
  });
}
