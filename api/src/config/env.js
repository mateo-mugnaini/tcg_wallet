import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN_DEV: z.string().url(),
  CORS_ORIGIN_PRODUCTION: z.string().url(),

  POKEMON_TCG_API_KEY: z.string().min(1),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration:");
  console.error(parsedEnv.error.issues);

  process.exit(1);
}

/* ====================================
      VALIDACIONES DE PRODUCCIÓN
==================================== */

if (
  parsedEnv.data.NODE_ENV === "production" &&
  (parsedEnv.data.JWT_ACCESS_SECRET ===
    "tu_access_secret_super_largo_y_aleatorio" ||
    parsedEnv.data.JWT_REFRESH_SECRET ===
      "tu_refresh_secret_super_largo_y_aleatorio")
) {
  console.error("JWT secrets inseguros para producción");
  process.exit(1);
}

/* ====================================
          CONFIGURACIÓN DE ENV
==================================== */

const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,

  database: {
    host: parsedEnv.data.DATABASE_HOST,
    port: parsedEnv.data.DATABASE_PORT,
    name: parsedEnv.data.DATABASE_NAME,
    user: parsedEnv.data.DATABASE_USER,
    password: parsedEnv.data.DATABASE_PASSWORD,
  },
  pokemonTcg: {
    apiKey: parsedEnv.data.POKEMON_TCG_API_KEY,
  },
  cors: {
    dev: parsedEnv.data.CORS_ORIGIN_DEV,
    production: parsedEnv.data.CORS_ORIGIN_PRODUCTION,
  },

  jwt: {
    accessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
    refreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsedEnv.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsedEnv.data.JWT_REFRESH_EXPIRES_IN,
  },
};

export default env;
