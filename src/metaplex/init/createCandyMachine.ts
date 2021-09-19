import { Keypair } from '@solana/web3.js';

import { CANDY_MACHINE_CONFIG_ADDRESS, CANDY_MACHINE_CONFIG_UUID, SOLANA_ENV, WALLET_PK } from '../env';
import { createCandyMachine } from '../methods';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

export default async function main({
  configUuid = CANDY_MACHINE_CONFIG_UUID,
  configAddress = CANDY_MACHINE_CONFIG_ADDRESS,
  items = 10,
} = {}) {
  const res = await createCandyMachine({
    env: SOLANA_ENV,
    walletKeyPair,
    configUuid,
    configAddress,
    currentItemCount: items,
    price: 1,
  });

  console.log(res);

  return res;
}

// main();
