import { z } from "zod";

/* ====================================
          SCHEMA INICIAR SESIÓN
==================================== */

export const loginSchema = z.object({
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

const authUserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
});

export const loginResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    accessToken: z.string().min(1),
    user: authUserResponseSchema,
  }),
});

export const refreshResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    accessToken: z.string().min(1),
  }),
});
