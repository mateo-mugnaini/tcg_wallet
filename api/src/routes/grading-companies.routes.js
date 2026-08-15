import express from "express";

import {
  getGradingCompaniesController,
  getGradingCompanyByIdController,
  createGradingCompanyController,
  updateGradingCompanyController,
  deleteGradingCompanyController,
} from "../controllers/grading-companies.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import {
  createGradingCompanySchema,
  updateGradingCompanySchema,
  gradingCompanyIdParamsSchema,
} from "../schemas/grading-companies.schema.js";

const router = express.Router();

/* ====================================
        LISTAR GRADING COMPANIES
==================================== */

router.get("/", authenticate, getGradingCompaniesController);

/* ====================================
      OBTENER GRADING COMPANY POR ID
==================================== */

router.get(
  "/:id",
  authenticate,
  validate(gradingCompanyIdParamsSchema, "params"),
  getGradingCompanyByIdController,
);

/* ====================================
        CREAR GRADING COMPANY (ADMIN)
==================================== */

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  validate(createGradingCompanySchema),
  createGradingCompanyController,
);

/* ====================================
      ACTUALIZAR GRADING COMPANY (ADMIN)
==================================== */

router.patch(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(gradingCompanyIdParamsSchema, "params"),
  validate(updateGradingCompanySchema),
  updateGradingCompanyController,
);

/* ====================================
      ELIMINAR GRADING COMPANY (ADMIN)
==================================== */

router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  validate(gradingCompanyIdParamsSchema, "params"),
  deleteGradingCompanyController,
);

export default router;
