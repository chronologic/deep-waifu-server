/* eslint-disable camelcase */
/* eslint-disable max-classes-per-file */
import { BN } from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';

export interface ICreator {
  address: string;
  verified: boolean;
  share: number;
}

export class Creator implements ICreator {
  address: string;

  verified: boolean;

  share: number;

  constructor(args: { address: string; verified: boolean; share: number }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

export interface IManifest {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  certificate?: string;
  seller_fee_basis_points: number;

  collection?: {
    name: string;
    family: string;
  };

  properties: {
    creators?: ICreator[] | null;
    files?: {
      uri: string;
      type: string;
      name?: string;
    }[];
  };
}

export interface Config {
  authority: PublicKey;
  data: IConfigData;
}

export interface IConfigData {
  name: string;
  symbol: string;
  uri: string;
  sellerFeeBasisPoints: number;
  creators: ICreator[] | null;
  maxNumberOfLines: BN | number;
  isMutable: boolean;
  maxSupply: BN;
  retainAuthority: boolean;
}

export class ConfigData implements IConfigData {
  name: string;

  symbol: string;

  uri: string;

  sellerFeeBasisPoints: number;

  creators: Creator[] | null;

  maxNumberOfLines: BN | number;

  isMutable: boolean;

  maxSupply: BN;

  retainAuthority: boolean;

  constructor(args: {
    name: string;
    symbol: string;
    uri: string;
    sellerFeeBasisPoints: number;
    creators: Creator[] | null;
    maxNumberOfLines: BN;
    isMutable: boolean;
    maxSupply: BN;
    retainAuthority: boolean;
  }) {
    this.name = args.name;
    this.symbol = args.symbol;
    this.uri = args.uri;
    this.sellerFeeBasisPoints = args.sellerFeeBasisPoints;
    this.creators = args.creators;
    this.maxNumberOfLines = args.maxNumberOfLines;
    this.isMutable = args.isMutable;
    this.maxSupply = args.maxSupply;
    this.retainAuthority = args.retainAuthority;
  }
}

export interface CandyMachineCache {
  program?: {
    uuid?: string;
    config?: string;
  };
  items?: {
    [key: string]: {
      link: string;
      name: string;
      onChain: boolean;
    };
  };
}
