import { UploadedFile } from 'express-fileupload';
import queue from 'queue';

import { MINUTE_MILLIS } from '../../constants';
import { CREATOR_ADDRESS, PAYMENT_PROGRAM_ID } from '../../env';
import { createLogger } from '../../logger';
import { getNameAndUri, IManifest, uploadAndMint } from '../../metaplex';
import { BadRequestError, NotFoundError } from '../errors';
import { createTimedCache } from '../utils';
import { createConnection, getPaymentProgramPdaAddress, paymentProgram, walletKeyPair } from './solana';

interface IMintParams {
  paymentTx: string;
  selfie: UploadedFile;
  name: string;
}

interface IMintPaymentTx {
  payer: string;
  id: number;
}

interface IMintResult {
  status: string;
  message: string;
}

const cache = createTimedCache<string, IMintResult>(60 * MINUTE_MILLIS);
const logger = createLogger('mint');

const MAX_FILE_SIZE_KB = 200;

const q = queue({
  concurrency: 1,
  autostart: true,
});

export async function pushMintToQueue(params: IMintParams): Promise<void> {
  validateName(params.name);
  validateFileSize(params.selfie);

  q.push(async () => mint(params));
  cache.put(params.paymentTx, { status: 'queued', message: `place in line: ${q.length}` });
}

async function mint({ paymentTx, selfie, name }: IMintParams) {
  let status = 'ok';
  let message = '';
  try {
    cache.put(paymentTx, { status: 'processing', message: '' });
    const decodedTx = await decodeAndValidateTx(paymentTx);
    await verifyIdNotUsed(decodedTx.id);
    await mintNft({ paymentTx, selfie, name }, decodedTx);
  } catch (e) {
    logger.error(e);
    status = 'error';
    message = e.message;
  } finally {
    cache.put(paymentTx, { status, message });
  }
}

function validateName(name: string) {
  if (name.length > 24) {
    throw new BadRequestError('Name can be at most 32 chars long');
  }
}

function validateFileSize(selfie: UploadedFile) {
  if (selfie.size > MAX_FILE_SIZE_KB * 1024) {
    throw new BadRequestError(`Max allowed file size is ${MAX_FILE_SIZE_KB}kB`);
  }
}

async function decodeAndValidateTx(tx: string): Promise<IMintPaymentTx> {
  const connection = createConnection();
  const { meta, transaction } = await connection.getTransaction(tx);

  if (meta.err) {
    throw new BadRequestError('Invalid payment tx: tx failed');
  }

  const accountKeys = transaction.message.accountKeys.map((k) => k.toBase58());

  if (!accountKeys.includes(PAYMENT_PROGRAM_ID)) {
    throw new BadRequestError('Invalid payment tx: payment program missing');
  }

  const logs = extractLogs(meta.logMessages);

  if (logs.length < 1) {
    throw new BadRequestError('Invalid payment tx: payment logs missing');
  }

  const { payer, id } = extractPayerAndIdFromLogs(logs);

  if (!payer || !id) {
    throw new BadRequestError('Invalid payment tx: payer and/or id missing');
  }

  const [pdaPubkey] = await getPaymentProgramPdaAddress();

  const { priceLamports, beneficiary } = (await paymentProgram.account.paymentStorage.fetch(pdaPubkey)) as any;

  const beneficiaryIndex = accountKeys.findIndex((k) => k === beneficiary.toBase58());

  const beneficiaryBalanceDiff = meta.postBalances[beneficiaryIndex] - meta.preBalances[beneficiaryIndex];

  if (beneficiaryBalanceDiff !== priceLamports.toNumber()) {
    throw new BadRequestError('Invalid payment tx: invalid payment amount');
  }

  return { payer, id };
}

function extractLogs(logMessages: string[]): string[] {
  const startIndex = logMessages.findIndex((msg) => msg.startsWith(`Program ${PAYMENT_PROGRAM_ID} invoke`));
  const endIndex = logMessages.findIndex((msg) => msg === `Program ${PAYMENT_PROGRAM_ID} success`);

  return logMessages.slice(startIndex, endIndex);
}

function extractPayerAndIdFromLogs(logMessages: string[]): IMintPaymentTx {
  const paymentRegex = /\[([A-Za-z0-9]{44}):([0-9]{1,4})\]/;
  const msg = logMessages.find((msg) => msg.includes('Paid for mint'));
  const [_, payer, id] = msg.match(paymentRegex);

  return { payer, id: Number(id) };
}

async function verifyIdNotUsed(id: number) {
  const { uri } = await getNameAndUri({ index: id - 1, walletKeyPair });

  return !uri.startsWith('http');
}

async function mintNft({ selfie, name }: IMintParams, { id, payer }: IMintPaymentTx) {
  const manifest = createManifest(name, id);
  await uploadAndMint({
    image: selfie.data,
    index: id - 1,
    manifest,
    mintToAddress: payer,
    walletKeyPair,
  });
}

function createManifest(name: string, id: number): IManifest {
  return {
    name: `${name} (#${id})`,
    symbol: 'DWF',
    description: `Deep Waifu #${id}`,
    seller_fee_basis_points: 500,
    collection: {
      family: 'Deep Waifu',
      name: 'Deep Waifu Edition 1',
    },
    image: 'image.png',
    properties: {
      creators: [{ address: CREATOR_ADDRESS, share: 100, verified: true }],
      files: [{ uri: 'image.png', type: 'image/png' }],
    },
  };
}

export function getStatus(paymentTx: string) {
  const res = cache.get(paymentTx);

  if (res) {
    return res;
  }

  throw new NotFoundError('Job not found');
}
