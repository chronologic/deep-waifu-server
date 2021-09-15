import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { SECOND_MILLIS } from '../constants';
import { imageController, mintController } from './controllers';

const router = Router();

const selfieLimiter = rateLimit({
  windowMs: 10 * SECOND_MILLIS,
  max: 1,
});

const mintLimiter = rateLimit({
  windowMs: 30 * SECOND_MILLIS,
  max: 1,
});

router.post('/selfie2anime', selfieLimiter, imageController.convert);

router.post('/mint', mintLimiter, mintController.mint);

router.get('/mint/:paymentTx', mintController.status);

export default router;
