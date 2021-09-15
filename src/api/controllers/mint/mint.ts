import { UploadedFile } from 'express-fileupload';
import { RequestHandler } from 'express';

import { requestMiddleware } from '../../middleware';
import { mintService } from '../../services';

const mint: RequestHandler = async (req, res) => {
  const result = await mintService.pushMintToQueue({
    selfie: req.files.selfie as UploadedFile,
    name: req.body.name,
    paymentTx: req.body.paymentTx,
  });

  res.setHeader('Content-Type', 'application/json');

  res.send(result);
};

export default requestMiddleware(mint);
