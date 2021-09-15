import FormData from 'form-data';
import anchor from '@project-serum/anchor';
import BN from 'bn.js';
import { MintLayout, Token } from '@solana/spl-token';

import { fromUTF8Array, parsePrice, upload } from './helpers/various';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction } from './helpers/instructions';
import {
  CONFIG_ARRAY_START,
  CONFIG_LINE_SIZE,
  PAYMENT_WALLET,
  TOKEN_METADATA_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from './helpers/constants';
import { sendTransactionWithRetryWithKeypair } from './helpers/transactions';
import {
  createConfig,
  getCandyMachineAddress,
  getMasterEdition,
  getMetadata,
  getTokenWallet,
  loadAnchorProgram,
} from './helpers/accounts';
import { Config, IManifest } from './types';
import { METAPLEX_CONFIG_ADDRESS, METAPLEX_CONFIG_UUID, SOLANA_ENV } from './env';

export async function initializeConfig({
  maxItems,
  walletKeyPair,
  env,
  manifest,
  image,
}: {
  maxItems: number;
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  manifest: IManifest;
  image: Buffer;
}): Promise<{
  configUuid: string;
  configAddress: string;
  imageUri: string;
}> {
  const index = 0;

  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);

  let config;
  let configUuid = '';
  let configAddress = '';

  console.log('initializing config');
  try {
    const res = await createConfig(anchorProgram, walletKeyPair, {
      maxNumberOfLines: new BN(maxItems),
      symbol: manifest.symbol,
      sellerFeeBasisPoints: manifest.seller_fee_basis_points,
      isMutable: true,
      maxSupply: new BN(0),
      retainAuthority: true,
      creators: manifest.properties.creators.map((creator) => {
        return {
          address: new PublicKey(creator.address),
          verified: true,
          share: creator.share,
        };
      }),
    });
    configUuid = res.uuid;
    configAddress = res.config.toBase58();
    config = res.config;

    console.log(`initialized config for a candy machine with uuid: ${res.uuid}`);
  } catch (exx) {
    console.error('Error deploying config to Solana network.', exx);
    // console.error(exx);
  }

  const res = await uploadImageAndAddConfigLine({
    walletKeyPair,
    configAddress,
    env,
    image,
    index: 0,
    manifest,
  });

  return {
    configUuid,
    configAddress,
    imageUri: res.link,
  };
}

export async function uploadAndMint({
  walletKeyPair,
  manifest,
  image,
  index,
  mintToAddress,
  env = SOLANA_ENV,
  configAddress = METAPLEX_CONFIG_ADDRESS,
  configUuid = METAPLEX_CONFIG_UUID,
}: {
  walletKeyPair: anchor.web3.Keypair;
  manifest: IManifest;
  image: Buffer;
  index: number;
  mintToAddress: string;
  env?: string;
  configAddress?: string;
  configUuid?: string;
}) {
  const res = await uploadImageAndAddConfigLine({
    env,
    walletKeyPair,
    manifest,
    image,
    index,
    configAddress,
  });

  const mintRes = await mintOneToken({
    walletKeyPair,
    env,
    configAddress,
    configUuid,
    mintToAddress,
  });
}

// TODO: handle failures and retry
export async function uploadImageAndAddConfigLine({
  walletKeyPair,
  env,
  manifest,
  image,
  index,
  configAddress,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  manifest: IManifest;
  image: Buffer;
  index: number;
  configAddress: string;
}): Promise<{
  link: string;
  uploaded: boolean;
  onChain: boolean;
}> {
  // const anchorProgram = await loadAnchorProgram(walletKeyPair, env);
  // const config = new anchor.web3.PublicKey(configAddress);

  const res = await uploadImageAndManifest({
    walletKeyPair,
    env,
    image,
    index,
    manifest,
  });

  const uploaded = res.success;
  const { link } = res;
  let onChain = false;

  try {
    await addConfigLine({
      configAddress,
      env,
      index,
      walletKeyPair,
      link,
      name: manifest.name,
    });
    onChain = true;
  } catch (e) {
    console.log(`saving config line ${index} failed`, e);
  }

  return {
    link,
    uploaded,
    onChain,
  };
}

export async function addConfigLine({
  walletKeyPair,
  env,
  index,
  link,
  name,
  configAddress,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  index: number;
  link: string;
  name: string;
  configAddress: string;
}): Promise<void> {
  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);
  const config = new anchor.web3.PublicKey(configAddress);

  await anchorProgram.rpc.addConfigLines(
    index,
    [
      {
        uri: link,
        name,
      },
    ],
    {
      accounts: {
        config,
        authority: walletKeyPair.publicKey,
      },
      signers: [walletKeyPair],
    }
  );
}

export async function initConfigLines({
  walletKeyPair,
  count,
  configAddress,
  env = SOLANA_ENV,
  link = '<uri>',
  name = '<name>',
}: {
  walletKeyPair: anchor.web3.Keypair;
  count: number;
  configAddress: string;
  env?: string;
  link?: string;
  name?: string;
}): Promise<void> {
  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);
  const config = new anchor.web3.PublicKey(configAddress);

  const stepSize = 10;

  for (let i = 0; i < count; i += stepSize) {
    const lines: { uri: string; name: string }[] = [];
    const max = i + stepSize > count ? count : i + stepSize;

    for (let j = i; j < max; j += 1) {
      lines.push({ uri: link, name });
    }

    await anchorProgram.rpc.addConfigLines(i, lines, {
      accounts: {
        config,
        authority: walletKeyPair.publicKey,
      },
      signers: [walletKeyPair],
    });
  }
}

export async function uploadImageAndManifest({
  walletKeyPair,
  env,
  manifest,
  image,
  index,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  manifest: IManifest;
  image: Buffer;
  index: number;
}): Promise<{
  link: string;
  success: boolean;
}> {
  const storageCost = 10;
  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);
  const manifestBuffer = Buffer.from(JSON.stringify(manifest));

  const instructions = [
    anchor.web3.SystemProgram.transfer({
      fromPubkey: walletKeyPair.publicKey,
      toPubkey: PAYMENT_WALLET,
      lamports: storageCost,
    }),
  ];

  const tx = await sendTransactionWithRetryWithKeypair(
    anchorProgram.provider.connection,
    walletKeyPair,
    instructions,
    [],
    'single'
  );
  console.info('transaction for arweave payment:', tx);

  // data.append('tags', JSON.stringify(tags));
  // payment transaction
  const data = new FormData();
  data.append('transaction', tx['txid']);
  data.append('env', env);
  data.append('file[]', image, {
    filename: 'image.png',
    contentType: 'image/png',
  });
  data.append('file[]', manifestBuffer, 'metadata.json');

  let link = '';
  let success = false;
  try {
    const result = await upload(data, manifest, index);

    const metadataFile = result.messages?.find((m: any) => m.filename === 'manifest.json');
    if (metadataFile?.transactionId) {
      link = `https://arweave.net/${metadataFile.transactionId}`;
      console.log(`File uploaded: ${link}`);
    }
    success = true;
  } catch (er) {
    console.error(`Error uploading file ${index}`, er);
  }

  return {
    link,
    success,
  };
}

export async function verify({
  walletKeyPair,
  env,
  configAddress,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  configAddress: string;
}): Promise<{
  allGood: boolean;
}> {
  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);

  const configPubKey = new PublicKey(configAddress);
  const config = await anchorProgram.provider.connection.getAccountInfo(configPubKey);
  const allGood = true;

  // console.log(fromUTF8Array([...config.data]));

  const configData = (await anchorProgram.account.config.fetch(configAddress)) as Config;

  for (let i = 0; i < configData.data.maxNumberOfLines; i++) {
    const thisSlice = config.data.slice(
      CONFIG_ARRAY_START + 4 + CONFIG_LINE_SIZE * i,
      CONFIG_ARRAY_START + 4 + CONFIG_LINE_SIZE * (i + 1)
    );
    const name = fromUTF8Array([...thisSlice.slice(4, 36)]);
    const uri = fromUTF8Array([...thisSlice.slice(40, 240)]);

    console.log({
      i,
      name,
      uri,
    });
  }

  return {
    allGood,
  };
}

export async function getNameAndUri({
  walletKeyPair,
  index,
  env = SOLANA_ENV,
  configAddress = METAPLEX_CONFIG_ADDRESS,
}: {
  walletKeyPair: anchor.web3.Keypair;
  index: number;
  env?: string;
  configAddress?: string;
}): Promise<{
  name: string;
  uri: string;
}> {
  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);

  const configPubKey = new PublicKey(configAddress);
  const config = await anchorProgram.provider.connection.getAccountInfo(configPubKey);

  const thisSlice = config.data.slice(
    CONFIG_ARRAY_START + 4 + CONFIG_LINE_SIZE * index,
    CONFIG_ARRAY_START + 4 + CONFIG_LINE_SIZE * (index + 1)
  );
  const name = fromUTF8Array([...thisSlice.slice(4, 36)]);
  const uri = fromUTF8Array([...thisSlice.slice(40, 240)]);

  return {
    name,
    uri,
  };
}

export async function createCandyMachine({
  walletKeyPair,
  env,
  price,
  configUuid,
  configAddress,
  currentItemCount,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  price: number;
  configUuid: string;
  configAddress: string;
  currentItemCount: number;
}): Promise<{
  candyMachineId: string;
  candyMachineConfig: string;
}> {
  const lamports = parsePrice(price);
  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);

  const config = new PublicKey(configAddress);
  const [candyMachine, bump] = await getCandyMachineAddress(config, configUuid);

  await anchorProgram.rpc.initializeCandyMachine(
    bump,
    {
      uuid: configUuid,
      price: new anchor.BN(lamports),
      itemsAvailable: new anchor.BN(currentItemCount),
      goLiveDate: null,
    },
    {
      accounts: {
        candyMachine,
        wallet: walletKeyPair.publicKey,
        config,
        authority: walletKeyPair.publicKey,
        payer: walletKeyPair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      signers: [],
    }
  );

  return {
    candyMachineId: candyMachine.toBase58(),
    candyMachineConfig: config.toBase58(),
  };
}

export async function setStartDate({
  walletKeyPair,
  env,
  date,
  configUuid,
  configAddress,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  date: string;
  configUuid: string;
  configAddress: string;
}): Promise<{
  secondsSinceEpoch: number;
  tx: string;
}> {
  const secondsSinceEpoch = (date ? Date.parse(date) : Date.now()) / 1000;

  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [candyMachine, _] = await getCandyMachineAddress(new PublicKey(configAddress), configUuid);
  const tx = await anchorProgram.rpc.updateCandyMachine(null, new anchor.BN(secondsSinceEpoch), {
    accounts: {
      candyMachine,
      authority: walletKeyPair.publicKey,
    },
  });

  return {
    secondsSinceEpoch,
    tx,
  };
}

export async function mintOneToken({
  walletKeyPair,
  env,
  configUuid,
  configAddress,
  mintToAddress,
}: {
  walletKeyPair: anchor.web3.Keypair;
  env: string;
  configUuid: string;
  configAddress: string;
  mintToAddress: string;
}): Promise<{ tx: string }> {
  const mint = Keypair.generate();

  const anchorProgram = await loadAnchorProgram(walletKeyPair, env);
  const mintToPubKey = new anchor.web3.PublicKey(mintToAddress);
  const userTokenAccountAddress = await getTokenWallet(mintToPubKey, mint.publicKey);

  const configPubKey = new PublicKey(configAddress);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [candyMachineAddress, bump] = await getCandyMachineAddress(configPubKey, configUuid);
  const candyMachine = await anchorProgram.account.candyMachine.fetch(candyMachineAddress);
  const metadataAddress = await getMetadata(mint.publicKey);
  const masterEdition = await getMasterEdition(mint.publicKey);
  const tx = await anchorProgram.rpc.mintNft({
    accounts: {
      config: configPubKey,
      candyMachine: candyMachineAddress,
      payer: walletKeyPair.publicKey,
      wallet: (candyMachine as any).wallet,
      mint: mint.publicKey,
      metadata: metadataAddress,
      masterEdition,
      mintAuthority: walletKeyPair.publicKey,
      updateAuthority: walletKeyPair.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    },
    signers: [mint, walletKeyPair],
    instructions: [
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: walletKeyPair.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports: await anchorProgram.provider.connection.getMinimumBalanceForRentExemption(MintLayout.span),
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        0,
        walletKeyPair.publicKey,
        walletKeyPair.publicKey
      ),
      createAssociatedTokenAccountInstruction(
        userTokenAccountAddress, // assoc addr
        walletKeyPair.publicKey, // payer
        mintToPubKey, // walletAddress - maybe target?
        mint.publicKey
      ),
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        userTokenAccountAddress,
        walletKeyPair.publicKey,
        [],
        1
      ),
    ],
  });

  return { tx };
}
