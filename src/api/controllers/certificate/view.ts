import { RequestHandler } from 'express';

import { requestMiddleware } from '../../middleware';
import { certificateService } from '../../services';

const view: RequestHandler = async (req, res) => {
  const view = certificateService.renderView(req.params.certificateId);

  res.setHeader('Content-Type', 'text/html; charset=UTF-8');

  res.send(view);
};

export default requestMiddleware(view);
