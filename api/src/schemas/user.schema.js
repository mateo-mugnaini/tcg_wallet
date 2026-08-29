import { z } from "zod";
import { sortOrderSchema } from "./common.schema.js";

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
    .toLowerCase()
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

  sortOrder: sortOrderSchema.default("DESC"),
});

/* ====================================
        SCHEMA ACTUALIZAR USUARIO
==================================== */
export const updateUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "El username debe tener al menos 3 caracteres")
      .max(50, "El username no puede superar los 50 caracteres")
      .optional(),

    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("El email no es válido")
      .max(255, "El email no puede superar los 255 caracteres")
      .optional(),

    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(255, "La contraseña no puede superar los 255 caracteres")
      .optional(),
  })
  .refine(
    (data) =>
      data.username !== undefined ||
      data.email !== undefined ||
      data.password !== undefined,
    {
      message: "Debes proporcionar al menos un campo para actualizar",
    },
  );

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["user", "admin"]),
  email: z.string().email(),
  username: z.string(),
  created_at: z.union([z.string(), z.date()]),
  updated_at: z.union([z.string(), z.date()]),
});

export const userListResponseSchema = z.object({
  data: z.array(userResponseSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export const userDataResponseSchema = z.object({
  data: userResponseSchema,
});

export const userDeleteResponseSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
});
