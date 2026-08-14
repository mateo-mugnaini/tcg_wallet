import { z } from "zod";

/* ====================================
            UUID REUTILIZABLE
==================================== */

const uuidSchema = z.uuid("Debe ser un UUID válido");

/* ====================================
            CREAR SET
==================================== */

export const createSetSchema = z
  .object({
    tcgId: uuidSchema,

    externalId: z
      .string()
      .trim()
      .min(1, "El externalId es obligatorio")
      .max(100, "El externalId no puede superar los 100 caracteres"),

    name: z
      .string()
      .trim()
      .min(1, "El nombre del Set es obligatorio")
      .max(255, "El nombre del Set no puede superar los 255 caracteres"),

    code: z
      .string()
      .trim()
      .max(100, "El código no puede superar los 100 caracteres")
      .optional()
      .nullable(),

    releaseDate: z
      .string()
      .date("La fecha de lanzamiento debe tener formato YYYY-MM-DD")
      .optional()
      .nullable(),
  })
  .strict();

/* ====================================
          ACTUALIZAR SET
==================================== */

export const updateSetSchema = z
  .object({
    tcgId: uuidSchema.optional(),

    externalId: z
      .string()
      .trim()
      .min(1, "El externalId no puede estar vacío")
      .max(100, "El externalId no puede superar los 100 caracteres")
      .optional()
      .nullable(),

    name: z
      .string()
      .trim()
      .min(1, "El nombre del Set no puede estar vacío")
      .max(255, "El nombre del Set no puede superar los 255 caracteres")
      .optional(),

    code: z
      .string()
      .trim()
      .max(100, "El código no puede superar los 100 caracteres")
      .optional()
      .nullable(),

    releaseDate: z
      .string()
      .date("La fecha de lanzamiento debe tener formato YYYY-MM-DD")
      .optional()
      .nullable(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/* ====================================
          PARÁMETROS DEL SET
==================================== */

export const setIdParamsSchema = z
  .object({
    id: uuidSchema,
  })
  .strict();

/* ====================================
            LISTAR SETS
==================================== */

export const getSetsQuerySchema = z
  .object({
    tcgId: uuidSchema.optional(),

    search: z
      .string()
      .trim()
      .min(1, "El parámetro search no puede estar vacío")
      .optional(),

    page: z.coerce
      .number()
      .int()
      .min(1, "La página debe ser mayor o igual a 1")
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1, "El límite debe ser mayor o igual a 1")
      .max(100, "El límite máximo es 100")
      .default(10),

    sortBy: z
      .enum(["name", "code", "release_date", "created_at"])
      .default("created_at"),

    sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
  })
  .strict();
