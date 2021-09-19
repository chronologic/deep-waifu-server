import { UploadedFile } from 'express-fileupload';
import queue from 'queue';

import { MINUTE_MILLIS } from '../../constants';
import { CREATOR_ADDRESS, PAYMENT_PROGRAM_ID } from '../../env';
import { createLogger } from '../../logger';
import { getNameAndUri, IManifest, uploadAndMint } from '../../metaplex';
import { BadRequestError, NotFoundError } from '../errors';
import { createMetaplexManifest, createTimedCache } from '../../utils';
import { provider, getPaymentProgramPdaAddress, paymentProgram, walletKeyPair } from '../../solana';

interface IMintParams {
  tx: string;
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
const MAX_NAME_LENGTH = 24;

const q = queue({
  concurrency: 1,
  autostart: true,
});

export async function pushMintToQueue(params: IMintParams): Promise<void> {
  validateName(params.name);
  validateFileSize(params.selfie);

  logger.info(`[${params.tx}] 🗄 adding to queue...`);
  q.push(async () => mint(params));
  cache.put(params.tx, { status: 'queued', message: `place in line: ${q.length}` });
}

async function mint({ tx, selfie, name }: IMintParams) {
  let status = 'ok';
  let message = '';
  try {
    logger.info(`[${tx}] 🧮 processing...`);
    cache.put(tx, { status: 'processing', message: '' });

    logger.info(`[${tx}] 📊 validating tx...`);
    const decodedTx = await decodeAndValidateTx(tx);

    logger.info(`[${tx}] 🗂 verifying id...`);
    await verifyIdNotUsed(decodedTx.id);

    logger.info(`[${tx}] 🚀 minting to ${decodedTx.payer}...`);
    await mintNft({ tx, selfie, name }, decodedTx);

    logger.info(`[${tx}] 👌 all done!`);
  } catch (e) {
    logger.error(`[${tx}] ❌ ERROR`);
    logger.error(e);
    status = 'error';
    message = e.message;
  } finally {
    cache.put(tx, { status, message });
  }
}

function validateName(name: string) {
  if (name.length > MAX_NAME_LENGTH) {
    throw new BadRequestError(`Name can be at most ${MAX_NAME_LENGTH} chars long`);
  }
}

function validateFileSize(selfie: UploadedFile) {
  if (selfie.size > MAX_FILE_SIZE_KB * 1024) {
    throw new BadRequestError(`Max allowed file size is ${MAX_FILE_SIZE_KB}kB`);
  }
}

async function decodeAndValidateTx(tx: string): Promise<IMintPaymentTx> {
  const { meta, transaction } = await provider.connection.getTransaction(tx);

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

  if (uri.startsWith('http')) {
    throw new BadRequestError(`ID ${id} has been spent`);
  }
}

async function mintNft({ selfie, name }: IMintParams, { id, payer }: IMintPaymentTx) {
  const manifest = createMetaplexManifest({
    name,
    id,
    creatorAddress: CREATOR_ADDRESS,
  });
  await uploadAndMint({
    image: selfie.data,
    index: id - 1,
    manifest,
    mintToAddress: payer,
    walletKeyPair,
  });
}

export function getStatus(paymentTx: string) {
  const res = cache.get(paymentTx);

  if (res) {
    return res;
  }

  throw new NotFoundError('Job not found');
}
