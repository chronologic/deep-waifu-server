import { UploadedFile } from 'express-fileupload';
import queue from 'queue';

import { MINUTE_MILLIS } from '../../constants';
import { PAYMENT_PROGRAM_ID } from '../../env';
import { createLogger } from '../../logger';
import { BadRequestError } from '../errors';
import { createTimedCache } from '../utils';
import { createConnection, getPaymentProgramPdaAddress, paymentProgram } from './solana';

interface IMintParams {
  paymentTx: string;
  selfie: UploadedFile;
  name: string;
}

interface IMintPaymentTx {
  payer: string;
  index: number;
}

interface IMintResult {
  status: string;
  message: string;
}

const cache = createTimedCache<string, IMintResult>(5 * MINUTE_MILLIS);
const logger = createLogger('mint');

const q = queue({
  concurrency: 1,
  autostart: true,
});

export async function pushMintToQueue(params: IMintParams): Promise<void> {
  q.push(async () => mint(params));
}

async function mint({ paymentTx, selfie, name }: IMintParams) {
  let status = 'ok';
  let message = '';
  try {
    const decodedTx = await decodeAndVerifyTx(paymentTx);
    await verifyIndexNotUsed(decodedTx.index);
  } catch (e) {
    logger.error(e);
    status = 'error';
    message = e.message;
  } finally {
    cache.put(paymentTx, { status, message });
  }
}

async function decodeAndVerifyTx(tx: string): Promise<IMintPaymentTx> {
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

  const { payer, index } = extractPayerAndIndexFromLogs(logs);

  if (!payer || !index) {
    throw new BadRequestError('Invalid payment tx: payer and/or index missing');
  }

  const [pdaPubkey] = await getPaymentProgramPdaAddress();

  const { priceLamports, beneficiary } = (await paymentProgram.account.paymentStorage.fetch(pdaPubkey)) as any;

  const beneficiaryIndex = accountKeys.findIndex((k) => k === beneficiary.toBase58());

  const beneficiaryBalanceDiff = meta.postBalances[beneficiaryIndex] - meta.preBalances[beneficiaryIndex];

  if (beneficiaryBalanceDiff !== priceLamports.toNumber()) {
    throw new BadRequestError('Invalid payment tx: invalid payment amount');
  }

  return { payer, index };
}

function extractLogs(logMessages: string[]): string[] {
  const startIndex = logMessages.findIndex((msg) => msg.startsWith(`Program ${PAYMENT_PROGRAM_ID} invoke`));
  const endIndex = logMessages.findIndex((msg) => msg === `Program ${PAYMENT_PROGRAM_ID} success`);

  return logMessages.slice(startIndex, endIndex);
}

function extractPayerAndIndexFromLogs(logMessages: string[]): IMintPaymentTx {
  const paymentRegex = /\[([A-Za-z0-9]{44}):([0-9]{1,4})\]/;
  const msg = logMessages.find((msg) => msg.includes('Paid for mint'));
  const [_, payer, index] = msg.match(paymentRegex);

  return { payer, index: Number(index) };
}

async function verifyIndexNotUsed(index: number) {
  // todo: implementme
}
