import * as anchor from '@project-serum/anchor';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import fs from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import makePrompt from 'prompt-sync';

import { CREATOR_ADDRESS, SOLANA_ENV } from './env';
import { bootstrap } from './metaplex';
import { walletKeyPair } from './solana';
import { createMetaplexManifest } from './utils';

const prompt = makePrompt();

main();

// ///////////////////////////////////////////////////////////////////

async function main() {
  const items = 1000;

  console.log('cluster:', SOLANA_ENV);
  console.log('signer:', walletKeyPair.publicKey.toBase58());
  console.log('creator address:', CREATOR_ADDRESS);
  console.log('items:', items);

  const userInput = prompt('Does the above look good? (Y/n): ', 'Y');

  if (userInput !== 'Y') {
    console.log('Stopping');
    return;
  }

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
    items,
  });

  const balanceAfter = await connection.getBalance(walletKeyPair.publicKey);

  console.log(`final deployer balance is ${balanceAfter / LAMPORTS_PER_SOL} SOL`);
  console.log(`consumed ${(balanceBefore - balanceAfter) / LAMPORTS_PER_SOL} SOL`);

  const cfg = {
    CANDY_MACHINE_CONFIG_UUID: res.configUuid,
    CANDY_MACHINE_CONFIG_ADDRESS: res.configAddress,
    METAPLEX_CANDY_MACHINE_ID: res.candyMachineId,
  };

  console.log(cfg);

  fs.writeFileSync(`./candyMachine_${res.candyMachineId}.json`, JSON.stringify(cfg, null, 2));
}
