import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validateResponse } from "../middlewares/validate-response.middleware.js";
import {
  getOpeningStatusController,
} from "../controllers/pack-openings.controller.js";
import {
  openingStatusResponseSchema,
} from "../schemas/pack-openings.schema.js";

const router = Router();

router.get(
  "/status",
  authenticate,
  validateResponse(openingStatusResponseSchema),
  getOpeningStatusController,
);

export default router;
