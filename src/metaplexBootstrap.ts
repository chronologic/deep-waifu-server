import fs from 'fs';

import { CREATOR_ADDRESS, SOLANA_ENV } from './env';
import { bootstrap } from './metaplex';
import { walletKeyPair } from './solana';
import { createMetaplexManifest } from './utils';

main();

async function main() {
  const image = fs.readFileSync('./images/anna.png');
  const manifest = createMetaplexManifest({
    name: 'Anna',
    id: 1,
    creatorAddress: CREATOR_ADDRESS,
  });

  const res = await bootstrap({
    walletKeyPair,
    image,
    manifest,
    env: SOLANA_ENV,
    items: 10,
  });

  console.log(res);

  fs.writeFileSync(`./${res.candyMachineId}.json`, JSON.stringify(res, null, 2));
}
