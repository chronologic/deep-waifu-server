import { RequestHandler } from 'express';

import { UI_URL } from '../../../env';
import { requestMiddleware } from '../../middleware';
import { stripeService } from '../../services';

const handleCheckoutSuccess: RequestHandler = async (req, res) => {
  await stripeService.handleCheckoutSuccess(req.params.sessionId);

  res.redirect(302, `${UI_URL}/orderSuccess`);
};

export default requestMiddleware(handleCheckoutSuccess);
