import dotenv from 'dotenv';
import web3 from '@solana/web3.js';

dotenv.config();

export const LOG_LEVEL = (process.env.LOG_LEVEL as string) || 'info';

export const PORT = Number(process.env.PORT) || 1337;

export const PROD_BUILD = __filename.endsWith('.js');

export const MODEL_URL = process.env.MODEL_URL as string;

export const SOLANA_ENV = process.env.SOLANA_ENV as web3.Cluster;

export const PAYMENT_PROGRAM_ID = process.env.PAYMENT_PROGRAM_ID as string;
