import * as anchor from '@project-serum/anchor';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';

import { CREATOR_ADDRESS, SOLANA_ENV } from './env';
import { bootstrap } from './metaplex';
import { walletKeyPair } from './solana';
import { createMetaplexManifest } from './utils';

main();

// ///////////////////////////////////////////////////////////////////

async function main() {
  const manifest = createMetaplexManifest({
    name: 'Anna',
    id: 1,
    creatorAddress: CREATOR_ADDRESS,
  });

  const apiUrl = anchor.web3.clusterApiUrl(SOLANA_ENV);
  const connection = new anchor.web3.Connection(apiUrl, 'confirmed');

  const balanceBefore = await connection.getBalance(walletKeyPair.publicKey);

  const res = await bootstrap({
    walletKeyPair,
    manifest,
    env: SOLANA_ENV,
    items: 1000,
  });

  const balanceAfter = await connection.getBalance(walletKeyPair.publicKey);

  console.log(`final deployer balance is ${balanceAfter / LAMPORTS_PER_SOL} SOL`);
  console.log(`consumed ${(balanceBefore - balanceAfter) / LAMPORTS_PER_SOL} SOL`);

  console.log(res);

  fs.writeFileSync(`./${res.candyMachineId}.json`, JSON.stringify(res, null, 2));
}
