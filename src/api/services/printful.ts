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
}) {
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

  console.log(orderDetails, PRINTFUL_KEY_B64, PRINTFUL_KEY);

  try {
    const { data } = await axios.post('https://api.printful.com/', orderDetails, {
      headers: {
        Authorization: `Basic ${PRINTFUL_KEY_B64}`,
      },
    });
    console.log(data);

    return data;
  } catch (e) {
    console.error(e);
  }
}

// {
//   "code": 200,
//   "result": {
//       "variant": {
//           "id": 4532,
//           "product_id": 83,
//           "name": "All-Over Print Basic Pillow 18×18",
//           "size": "18×18",
//           "color": null,
//           "color_code": null,
//           "color_code2": null,
//           "image": "https://files.cdn.printful.com/products/83/4532_1581582292.jpg",
//           "price": "14.95",
//           "in_stock": true,
//           "availability_regions": {
//               "US": "United States",
//               "EU": "Europe",
//               "EU_LV": "Latvia",
//               "EU_ES": "Spain",
//               "AU": "Australia",
//               "JP": "Japan",
//               "CA": "Canada",
//               "BR": "Brazil",
//               "CN": "China"
//           },
//           "availability_status": [
//               {
//                   "region": "US",
//                   "status": "in_stock"
//               },
//               {
//                   "region": "EU",
//                   "status": "in_stock"
//               },
//               {
//                   "region": "EU_LV",
//                   "status": "in_stock"
//               },
//               {
//                   "region": "EU_ES",
//                   "status": "supplier_out_of_stock"
//               },
//               {
//                   "region": "AU",
//                   "status": "supplier_out_of_stock"
//               },
//               {
//                   "region": "JP",
//                   "status": "supplier_out_of_stock"
//               },
//               {
//                   "region": "CA",
//                   "status": "supplier_out_of_stock"
//               },
//               {
//                   "region": "BR",
//                   "status": "supplier_out_of_stock"
//               },
//               {
//                   "region": "CN",
//                   "status": "supplier_out_of_stock"
//               }
//           ]
//       },
//       "product": {
//           "id": 83,
//           "type": "CUT-SEW",
//           "type_name": "All-Over Print Basic Pillow",
//           "brand": null,
//           "model": "All-Over Print Basic Pillow",
//           "image": "https://files.cdn.printful.com/o/products/83/product_1573737219.jpg",
//           "variant_count": 3,
//           "currency": "EUR",
//           "files": [
//               {
//                   "id": "default",
//                   "type": "front",
//                   "title": "Front print",
//                   "additional_price": null
//               },
//               {
//                   "id": "back",
//                   "type": "back",
//                   "title": "Back print",
//                   "additional_price": null
//               },
//               {
//                   "id": "preview",
//                   "type": "mockup",
//                   "title": "Mockup",
//                   "additional_price": null
//               }
//           ],
//           "options": [
//               {
//                   "id": "stitch_color",
//                   "title": "Zipper & Stitch color",
//                   "type": "radio",
//                   "values": {
//                       "white": "White",
//                       "black": "Black"
//                   },
//                   "additional_price": null,
//                   "additional_price_breakdown": []
//               },
//               {
//                   "id": "notes",
//                   "title": "Printing notes",
//                   "type": "text",
//                   "values": null,
//                   "additional_price": null,
//                   "additional_price_breakdown": []
//               }
//           ],
//           "dimensions": {
//               "default": "19x19"
//           },
//           "is_discontinued": false,
//           "avg_fulfillment_time": null,
//           "description": "A strategically placed accent can bring the whole room to life, and this pillow is just what you need to do that. What's more, the soft, machine-washable case with the shape-retaining insert is a joy to have long afternoon naps on.\r\n\r\n• 100% polyester case and insert\r\n• Fabric weight: 6.49–8.85 oz/yd² (220–300 g/m²)\r\n• Hidden zipper\r\n• Machine-washable case\r\n• Shape-retaining polyester insert included (handwash only)\r\n• Blank product components in the US sourced from China and the US\r\n• Blank product components in the EU sourced from China and Poland"
//       }
//   },
//   "extra": []
// }
