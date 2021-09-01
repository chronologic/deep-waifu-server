import dotenv from 'dotenv';

dotenv.config();

export const LOG_LEVEL = (process.env.LOG_LEVEL as string) || 'info';

export const PORT = Number(process.env.PORT) || 1337;

export const PROD_BUILD = __filename.endsWith('.js');

export const MODEL_URL = process.env.MODEL_URL as string;
