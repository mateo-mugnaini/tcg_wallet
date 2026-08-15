import { z } from "zod";

/* ====================================
      CREAR GRADING COMPANY SCHEMA
==================================== */

export const createGradingCompanySchema = z.object({
  name: z
    .string({
      required_error: "El nombre de la empresa de grading es obligatorio",
    })
    .trim()
    .min(1, "El nombre no puede estar vacío")
    .max(50, "El nombre no puede exceder los 50 caracteres"),
});

/* ====================================
    ACTUALIZAR GRADING COMPANY SCHEMA
==================================== */

export const updateGradingCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío")
    .max(50, "El nombre no puede exceder los 50 caracteres")
    .optional(),
});

/* ====================================
      PARAMS ID SCHEMA (UUID)
==================================== */

export const gradingCompanyIdParamsSchema = z.object({
  id: z.string().uuid("El ID proporcionado debe ser un UUID válido"),
});
