import { Keypair } from '@solana/web3.js';

import initConfig from './initConfig';
import createCandyMachine from './createCandyMachine';
import setStartDate from './setStartDate';
import { mintOneToken, uploadImageAndAddConfigLine } from '../methods';
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
  // await addConfigLine({
  //   configAddress: res.configAddress,
  //   env,
  //   index: 0,
  //   link: 'https://arweave.net/-o-ExqLc0JSH89_xM3b7lPhGOS6vM78kwaGr4jeue-I',
  //   name: manifest.name,
  //   walletKeyPair,
  // });

  console.log('intializing config...');
  const initConfigRes = await initConfig({ items, manifest, walletKeyPair, env });

  console.log('uploading and adding config line for first image...');
  const uploadRes = await uploadImageAndAddConfigLine({
    walletKeyPair,
    configAddress: initConfigRes.configAddress,
    env,
    image,
    index: 0,
    manifest,
  });

  console.log('creating candy machine...');
  const createCandyMachineRes = await createCandyMachine({
    items,
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
  });
  console.log('setting start date...');
  await setStartDate({
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
  });

  console.log('minting first token...');
  const tx = await mintOneToken({
    walletKeyPair,
    env: SOLANA_ENV,
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
    mintToAddress: walletKeyPair.publicKey.toBase58(),
  });

  return {
    configUuid: initConfigRes.configUuid,
    configAddress: initConfigRes.configAddress,
    imageUri: uploadRes.link,
    candyMachineId: createCandyMachineRes.candyMachineId,
    candyMachineConfig: createCandyMachineRes.candyMachineConfig,
    mintTx: tx,
  };
}
