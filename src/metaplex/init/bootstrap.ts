import { Keypair } from '@solana/web3.js';

import initConfig from './initConfig';
import createCandyMachine from './createCandyMachine';
import setStartDate from './setStartDate';
import { mintOneToken } from '../methods';
import { SOLANA_ENV, WALLET_PK } from '../env';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

async function main() {
  const items = 5;
  const initConfigRes = await initConfig({ items });
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

main();
