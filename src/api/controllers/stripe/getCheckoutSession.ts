import { RequestHandler } from 'express';

import { requestMiddleware } from '../../middleware';
import { stripeService } from '../../services';

const getCheckoutSession: RequestHandler = async (req, res) => {
  const result = await stripeService.getCheckoutSession(req.params.id);

  res.setHeader('Content-Type', 'application/json');

  res.send(result);
};

export default requestMiddleware(getCheckoutSession);
