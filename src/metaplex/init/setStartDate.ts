import { Keypair } from '@solana/web3.js';

import { METAPLEX_CONFIG_ADDRESS, METAPLEX_CONFIG_UUID, SOLANA_ENV, WALLET_PK } from '../env';
import { setStartDate } from '../methods';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

export default async function main({
  configUuid = METAPLEX_CONFIG_UUID,
  configAddress = METAPLEX_CONFIG_ADDRESS,
} = {}) {
  const res = await setStartDate({
    env: SOLANA_ENV,
    walletKeyPair,
    configUuid,
    configAddress,
    date: new Date().toISOString(),
  });

  console.log(res);

  return res;
}
