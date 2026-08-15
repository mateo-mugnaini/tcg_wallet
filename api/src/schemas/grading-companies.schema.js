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

export const gradingCompanyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.union([z.string(), z.date()]),
});

export const gradingCompaniesListResponseSchema = z.object({
  data: z.array(gradingCompanyResponseSchema),
});

export const gradingCompanyDataResponseSchema = z.object({
  data: gradingCompanyResponseSchema,
});

export const gradingCompanyMutationResponseSchema = z.object({
  message: z.string(),
  data: gradingCompanyResponseSchema,
});
