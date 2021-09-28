import { UploadedFile } from 'express-fileupload';
import * as anchor from '@project-serum/anchor';
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
  dayPayment: boolean;
  waifu: UploadedFile;
  certificate: UploadedFile;
  name: string;
}

interface IMintPaymentTx {
  payer: string;
  id: number;
}

interface IMintResult {
  status: string;
  message: string;
  id?: number;
  tx?: string;
  metadataLink?: string;
  certificateLink?: string;
}

const cache = createTimedCache<string, IMintResult>(60 * MINUTE_MILLIS);
const logger = createLogger('mint');

const MAX_FILE_SIZE_KB = 1024;
const MAX_NAME_LENGTH = 24;

const q = queue({
  concurrency: 1,
  autostart: true,
});

export async function pushMintToQueue(params: IMintParams): Promise<void> {
  validateName(params.name);
  validateFileSize(params.waifu);
  validateFileSize(params.certificate);

  logger.info(`[${params.tx}] 🗄 adding to queue...`);
  cache.put(params.tx, { status: 'queued', message: `place in line: ${q.length}` });
  q.push(async () => mint(params));
}

async function mint({ tx, dayPayment, waifu, certificate, name }: IMintParams) {
  try {
    logger.info(`[${tx}] 🧮 processing...`);
    cache.put(tx, { status: 'processing', message: 'Processing...' });

    logger.info(`[${tx}] 📊 validating tx...`);
    const decodedTx = await decodeAndValidateTx(tx, dayPayment);

    logger.info(`[${tx}] 🗂 verifying id...`);
    await verifyIdNotUsed(decodedTx.id);

    logger.info(`[${tx}] 🚀 minting to ${decodedTx.payer}...`);
    const mintedRes = await mintNft({ tx, dayPayment, waifu, certificate, name }, decodedTx);
    cache.put(tx, {
      status: 'minted',
      message: 'Success!',
      id: decodedTx.id,
      tx: mintedRes.tx,
      metadataLink: mintedRes.metadataLink,
      certificateLink: mintedRes.certificateLink,
    });

    logger.info(`[${tx}] 👌 all done!`);
  } catch (e) {
    logger.error(`[${tx}] ❌ ERROR`);
    logger.error(e);
    cache.put(tx, { status: 'error', message: e.message });
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

async function decodeAndValidateTx(tx: string, dayPayment: boolean): Promise<IMintPaymentTx> {
  const { meta, transaction } = await provider.connection.getTransaction(tx);

  if (meta.err) {
    throw new BadRequestError('Invalid payment tx: tx failed');
  }

  const accountKeys = transaction.message.accountKeys.map((k) => k.toBase58());

  if (!accountKeys.includes(PAYMENT_PROGRAM_ID)) {
    throw new BadRequestError('Invalid payment tx: payment program missing');
  }

  const logs = extractProgramLogs(meta.logMessages);

  const { payer, id } = extractPayerAndIdFromLogs(logs);

  if (!payer || !id) {
    throw new BadRequestError('Invalid payment tx: payer and/or id missing');
  }

  const [pdaPubkey] = await getPaymentProgramPdaAddress();

  const { priceLamports, priceDay, beneficiary, beneficiaryDay } = (await paymentProgram.account.paymentStorage.fetch(
    pdaPubkey
  )) as any;

  if (dayPayment) {
    const beneficiaryIndex = accountKeys.findIndex((k) => k === beneficiaryDay.toBase58());

    const preTokenBalance = new anchor.BN(
      meta.preTokenBalances.find((b) => b.accountIndex === beneficiaryIndex).uiTokenAmount.amount
    );
    const postTokenBalance = new anchor.BN(
      meta.postTokenBalances.find((b) => b.accountIndex === beneficiaryIndex).uiTokenAmount.amount
    );
    const balanceDiff = postTokenBalance.sub(preTokenBalance);

    if (balanceDiff.toNumber() !== priceDay.toNumber()) {
      throw new BadRequestError('Invalid payment tx: invalid DAY payment amount');
    }
  } else {
    const beneficiaryIndex = accountKeys.findIndex((k) => k === beneficiary.toBase58());

    const beneficiaryBalanceDiff = meta.postBalances[beneficiaryIndex] - meta.preBalances[beneficiaryIndex];

    // allow some difference for tx fee
    if (beneficiaryBalanceDiff < priceLamports.toNumber() * 0.95) {
      throw new BadRequestError('Invalid payment tx: invalid payment amount');
    }
  }

  return { payer, id };
}

function extractProgramLogs(logMessages: string[]): string[] {
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

async function mintNft(
  { waifu, certificate, name }: IMintParams,
  { id, payer }: IMintPaymentTx
): Promise<{ tx: string; metadataLink: string; certificateLink: string }> {
  const manifest = createMetaplexManifest({
    name,
    id,
    creatorAddress: CREATOR_ADDRESS,
  });
  const res = await uploadAndMint({
    image: waifu.data,
    certificate: certificate.data,
    index: id - 1,
    manifest,
    mintToAddress: payer,
    walletKeyPair,
  });

  return res;
}

export function getStatus(paymentTx: string) {
  const res = cache.get(paymentTx);

  if (res) {
    return res;
  }

  throw new NotFoundError('Job not found');
}
