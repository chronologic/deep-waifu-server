import axios from 'axios';
import { PRINTFUL_KEY } from '../../env';

const buf = Buffer.from(PRINTFUL_KEY);
const PRINTFUL_KEY_B64 = buf.toString('base64');
const PILLOW_VARIANT_ID = 4532;

export async function orderPillow({
  name,
  address1,
  address2,
  city,
  stateCode,
  countryCode,
  zip,
  imageUrl,
}: {
  name: string;
  address1: string;
  address2: string;
  city: string;
  stateCode: string;
  countryCode: string;
  zip: string;
  imageUrl: string;
}): Promise<{
  orderId: number;
}> {
  const orderDetails = {
    recipient: {
      name,
      address1,
      address2,
      city,
      state_code: stateCode,
      country_code: countryCode,
      zip,
    },
    items: [
      {
        variant_id: PILLOW_VARIANT_ID,
        quantity: 1,
        files: [
          {
            type: 'default',
            url: imageUrl,
          },
          {
            type: 'back',
            url: imageUrl,
          },
        ],
        options: [{ id: 'stitch_color', value: 'white' }],
      },
    ],
  };

  const { data } = await axios.post('https://api.printful.com/orders', orderDetails, {
    headers: {
      Authorization: `Basic ${PRINTFUL_KEY_B64}`,
    },
  });

  return { orderId: data.result.id };
}
