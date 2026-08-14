import { z } from "zod";

/* ====================================
            SCHEMA CREAR TCG
==================================== */
export const createTcgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del TCG es obligatorio")
    .max(255, "El nombre del TCG no puede superar los 255 caracteres"),
});

/* ====================================
          SCHEMA PARÁMETROS TCG
==================================== */
export const tcgIdParamsSchema = z.object({
  id: z.uuid("El ID del TCG debe ser un UUID válido"),
});

/* ====================================
          SCHEMA ACTUALIZAR TCG
==================================== */
export const updateTcgSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "El nombre del TCG es obligatorio")
      .max(255, "El nombre del TCG no puede superar los 255 caracteres")
      .optional(),
  })
  .refine((data) => data.name !== undefined, {
    message: "Debes proporcionar al menos un campo para actualizar",
  });

/* ====================================
           SCHEMA LISTAR TCGS
==================================== */
export const getTcgQuerySchema = z.object({
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

  search: z
    .string()
    .trim()
    .max(100, "La búsqueda no puede superar los 100 caracteres")
    .optional(),

  sortBy: z.enum(["name", "created_at"]).default("created_at"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
