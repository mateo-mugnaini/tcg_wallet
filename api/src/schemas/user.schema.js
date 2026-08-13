import { z } from "zod";

/* ====================================
          SCHEMA CREAR USUARIO
==================================== */
export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El username debe tener al menos 3 caracteres")
    .max(50, "El username no puede superar los 50 caracteres"),

  email: z
    .string()
    .trim()
    .email("El email no es válido")
    .max(255, "El email no puede superar los 255 caracteres"),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(255, "La contraseña no puede superar los 255 caracteres"),
});

/* ====================================
        SCHEMA PARÁMETROS USUARIO
==================================== */
export const userIdParamsSchema = z.object({
  id: z.uuid("El ID del usuario debe ser un UUID válido"),
});

/* ====================================
        SCHEMA EMAIL USUARIO
==================================== */
export const userEmailParamsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("El email no es válido")
    .max(255, "El email no puede superar los 255 caracteres"),
});

/* ====================================
        SCHEMA LISTAR USUARIOS
==================================== */
export const getUsersQuerySchema = z.object({
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

  sortBy: z
    .enum(["username", "email", "created_at", "updated_at"])
    .default("created_at"),

  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
