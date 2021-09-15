import { Keypair } from '@solana/web3.js';

import { METAPLEX_CONFIG_ADDRESS, METAPLEX_CONFIG_UUID, SOLANA_ENV, WALLET_PK } from '../env';
import { createCandyMachine } from '../methods';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

export default async function main({
  configUuid = METAPLEX_CONFIG_UUID,
  configAddress = METAPLEX_CONFIG_ADDRESS,
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
