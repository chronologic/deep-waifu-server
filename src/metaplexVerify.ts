import { SOLANA_ENV } from './env';
import { verify } from './metaplex';
import { CANDY_MACHINE_CONFIG_ADDRESS } from './metaplex/env';
import { walletKeyPair } from './solana';

main();

async function main() {
  await verify({
    walletKeyPair,
    env: SOLANA_ENV,
    configAddress: CANDY_MACHINE_CONFIG_ADDRESS,
  });
}
