import { config } from 'dotenv';

config();

export const CANDY_MACHINE_CONFIG_UUID = process.env.CANDY_MACHINE_CONFIG_UUID as string;
export const CANDY_MACHINE_CONFIG_ADDRESS = process.env.CANDY_MACHINE_CONFIG_ADDRESS as string;

export const CREATOR_ADDRESS = process.env.CREATOR_ADDRESS as string;

export const WALLET_PK = process.env.WALLET_PK as string;

export const SOLANA_ENV = process.env.SOLANA_ENV as string;
