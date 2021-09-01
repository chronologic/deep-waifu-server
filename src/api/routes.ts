import { Router } from "express";
import rateLimit from "express-rate-limit";

import { SECOND_MILLIS } from "./../constants";
import { imageController } from "./controllers";

const router = Router();

const selfieLimiter = rateLimit({
  windowMs: 10 * SECOND_MILLIS,
  max: 1,
});

router.post("/selfie2anime", selfieLimiter, imageController.convert);

export default router;
