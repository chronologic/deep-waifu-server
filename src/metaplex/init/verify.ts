import { Keypair } from '@solana/web3.js';

import { METAPLEX_CONFIG_ADDRESS, SOLANA_ENV, WALLET_PK } from '../env';
import { verify } from '../methods';

const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(WALLET_PK)));

async function main() {
  const res = await verify({
    env: SOLANA_ENV,
    walletKeyPair,
    configAddress: METAPLEX_CONFIG_ADDRESS,
  });

  console.log(res);
}

main();
