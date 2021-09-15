import { config } from 'dotenv';

config();

export const METAPLEX_CONFIG_UUID = process.env.METAPLEX_CONFIG_UUID as string;
export const METAPLEX_CONFIG_ADDRESS = process.env.METAPLEX_CONFIG_ADDRESS as string;
export const METAPLEX_CANDY_MACHINE_ID = process.env.METAPLEX_CANDY_MACHINE_ID as string;

export const CREATOR_ADDRESS = process.env.CREATOR_ADDRESS as string;

export const WALLET_PK = process.env.WALLET_PK as string;

export const SOLANA_ENV = process.env.SOLANA_ENV as string;
