import { IManifest } from '../metaplex';

export function createMetaplexManifest({
  name,
  id,
  creatorAddress,
}: {
  name: string;
  id: number;
  creatorAddress: string;
}): IManifest {
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
    certificate: 'certificate.png',
    properties: {
      creators: [{ address: creatorAddress, share: 100, verified: true }],
      files: [
        { uri: 'image.png', type: 'image/png' },
        { uri: 'certificate.png', type: 'image/png', name: 'certificate' },
      ],
    },
  };
}
