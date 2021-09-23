import { RequestHandler } from 'express';
import { UploadedFile } from 'express-fileupload';

import { requestMiddleware } from '../../middleware';
import { stripeService } from '../../services';

const createCheckoutIntent: RequestHandler = async (req, res) => {
  const result = await stripeService.createCheckoutIntent({
    ...req.body,
    image: req.files.image as UploadedFile,
  });

  res.setHeader('Content-Type', 'application/json');

  res.send(result);
};

export default requestMiddleware(createCheckoutIntent);
