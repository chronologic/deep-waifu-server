import { UploadedFile } from 'express-fileupload';
import { RequestHandler } from 'express';

import { requestMiddleware } from '../../middleware';
import { imageService } from '../../services';

const mint: RequestHandler = async (req, res) => {
  const anime = await imageService.selfie2anime(req.files.selfie as UploadedFile);

  res.setHeader('Content-Type', 'image/png');

  res.send(anime);
};

export default requestMiddleware(mint);
