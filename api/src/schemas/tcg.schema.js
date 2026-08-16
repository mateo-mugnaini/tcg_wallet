import { z } from "zod";
import { sortOrderSchema } from "./common.schema.js";

/* ====================================
          CREAR TCG
==================================== */

export const createTcgSchema = z.object({
  name: z
    .string({
      required_error: "El nombre del TCG es obligatorio",
      invalid_type_error: "El nombre del TCG debe ser un texto",
    })
    .trim()
    .min(1, "El nombre del TCG es obligatorio")
    .max(100, "El nombre del TCG no puede superar los 100 caracteres"),
});

/* ====================================
        ACTUALIZAR TCG
==================================== */

export const updateTcgSchema = z
  .object({
    name: z
      .string({
        invalid_type_error: "El nombre del TCG debe ser un texto",
      })
      .trim()
      .min(1, "El nombre del TCG no puede estar vacío")
      .max(100, "El nombre del TCG no puede superar los 100 caracteres")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar",
  });

/* ====================================
          PARÁMETROS POR ID
==================================== */

export const tcgIdParamsSchema = z.object({
  id: z
    .string({
      required_error: "El ID del TCG es obligatorio",
      invalid_type_error: "El ID del TCG debe ser un texto",
    })
    .uuid("El ID del TCG debe ser un UUID válido"),
});

/* ====================================
            LISTAR TCGS
==================================== */

export const getTcgsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "La búsqueda no puede superar los 100 caracteres")
    .optional(),

  page: z.coerce
    .number()
    .int("La página debe ser un número entero")
    .min(1, "La página debe ser mayor o igual a 1")
    .default(1),

  limit: z.coerce
    .number()
    .int("El límite debe ser un número entero")
    .min(1, "El límite debe ser mayor o igual a 1")
    .max(100, "El límite no puede superar 100")
    .default(10),

  sortBy: z.enum(["name", "created_at"]).default("created_at"),

  sortOrder: sortOrderSchema.default("DESC"),
});

export const tcgResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.union([z.string(), z.date()]),
});

export const tcgsListResponseSchema = z.object({
  data: z.array(tcgResponseSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
