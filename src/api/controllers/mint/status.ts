import { RequestHandler } from 'express';

import { requestMiddleware } from '../../middleware';
import { mintService } from '../../services';

const status: RequestHandler = async (req, res) => {
  const result = mintService.getStatus(req.params.paymentTx);

  res.setHeader('Content-Type', 'application/json');

  res.send(result);
};

export default requestMiddleware(status);
