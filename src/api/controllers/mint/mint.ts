import { UploadedFile } from 'express-fileupload';
import { RequestHandler } from 'express';

import { requestMiddleware } from '../../middleware';
import { mintService } from '../../services';

const mint: RequestHandler = async (req, res) => {
  const result = await mintService.pushMintToQueue({
    waifu: req.files.waifu as UploadedFile,
    certificate: req.files.certificate as UploadedFile,
    name: req.body.name,
    tx: req.body.tx,
    dayPayment: req.body.dayPayment,
  });

  res.setHeader('Content-Type', 'application/json');

  res.send(result);
};

export default requestMiddleware(mint);
