import { UploadedFile } from 'express-fileupload';
import Stripe from 'stripe';

import { HOUR_MILLIS } from '../../constants';
import { PILLOW_PRICE_USD, SELF_URL, STRIPE_SECRET_KEY, UI_URL } from '../../env';
import { createTimedCache } from '../../utils';
import { BadRequestError } from '../errors';
import { upload } from './imgbb';
import { orderPillow } from './printful';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

const processedOrdersCache = createTimedCache<string, boolean>(24 * HOUR_MILLIS);

export async function createCheckoutIntent({ name, image }: { name: string; image: UploadedFile }): Promise<{
  sessionId: string;
  checkoutUrl: string;
}> {
  const imageUrl = await upload(image);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    locale: 'en',
    line_items: [
      {
        name,
        images: [imageUrl],
        quantity: 1,
        currency: 'usd',
        amount: PILLOW_PRICE_USD * 100,
      },
    ],
    shipping_address_collection: {
      allowed_countries: [
        'US',
        'CA',
        'JP',
        'AL', // Albania
        'AD', // Andorra
        'AM', // Armenia
        'AT', // Austria (also sometimes OE in German-speaking countries: for "Oesterreich"
        'BY', // Belarus
        'BE', // Belgium
        'BA', // Bosnia and Herzegovina
        'BG', // Bulgaria
        'CH', // Switzerland (from Confoederatio Helvetica)
        'CY', // Cyprus
        'CZ', // Czech Republic
        'DE', // Germany
        'DK', // Denmark
        'EE', // Estonia
        'ES', // Spain
        'FO', // Faeroe Islands
        'FI', // Finland
        'FR', // France
        'GB', // United Kingdom (of Great Britain and Northern Ireland)
        'GE', // Georgia
        'GI', // Gibraltar
        'GR', // Greece
        'HU', // Hungary
        'HR', // Croatia (local name: Hrvatska)
        'IE', // Ireland
        'IS', // Iceland
        'IT', // Italy
        'LT', // Lithuania
        'LU', // Luxembourg
        'LV', // Latvia
        'MC', // Monaco
        'MK', // Macedonia
        'MT', // Malta
        'NO', // Norway
        'NL', // Netherlands
        'PL', // Poland
        'PT', // Portugal
        'RO', // Romania
        'RU', // Russian Federation
        'SE', // Sweden
        'SI', // Slovenia
        'SK', // Slovakia (Slovakian Republic)
        'SM', // San Marino
        'TR', // Turkey
        'UA', // Ukraine
        'VA', // Vatican City State
      ],
    },
    // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
    success_url: `${SELF_URL}/checkoutSuccess/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${UI_URL}/orderError`,
    metadata: {
      imageUrl,
    },
  });

  return { sessionId: session.id, checkoutUrl: session.url };
}

export async function getCheckoutSession(id: string) {
  const session = await stripe.checkout.sessions.retrieve(id);
  return session;
}

export async function handleCheckoutSuccess(sessionId: string): Promise<{ paymentId: string; orderId: number }> {
  if (processedOrdersCache.get(sessionId)) {
    throw new BadRequestError(`Order ${sessionId} already processed`);
  }
  processedOrdersCache.put(sessionId, true);

  const session = await getCheckoutSession(sessionId);

  if (session.payment_status !== 'paid') {
    throw new BadRequestError(`Order ${sessionId} not paid`);
  }

  const { shipping } = session;

  const { orderId } = await orderPillow({
    name: shipping.name,
    address1: shipping.address.line1,
    address2: shipping.address.line2,
    city: shipping.address.city,
    countryCode: shipping.address.country,
    stateCode: shipping.address.state,
    zip: shipping.address.postal_code,
    imageUrl: session.metadata.imageUrl,
  });

  return { paymentId: session.id, orderId };
}
