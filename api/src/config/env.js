import "dotenv/config";
import { z } from "zod";
import { logger } from "../utils/logger.js";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "staging", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(2203),
  DATABASE_NAME: z.string().min(1),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string(),
  DATABASE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(5000),
  DATABASE_IDLE_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  DATABASE_STATEMENT_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30000),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),

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
  logger.error("invalid_environment_configuration", {
    issues: parsedEnv.error.issues.map(({ path, code, message }) => ({
      path,
      code,
      message,
    })),
  });

  process.exit(1);
}

const productionLikeEnvironments = new Set(["staging", "production"]);
const isProductionLike = productionLikeEnvironments.has(parsedEnv.data.NODE_ENV);

/* ====================================
      VALIDACIONES DE PRODUCCIÓN/STAGING
==================================== */

if (
  isProductionLike &&
  (parsedEnv.data.JWT_ACCESS_SECRET ===
    "tu_access_secret_super_largo_y_aleatorio" ||
    parsedEnv.data.JWT_REFRESH_SECRET ===
      "tu_refresh_secret_super_largo_y_aleatorio")
) {
  logger.error("insecure_jwt_secrets_for_production");
  process.exit(1);
}

if (isProductionLike && !parsedEnv.data.DATABASE_SSL) {
  logger.error("database_ssl_required_for_staging_or_production");
  process.exit(1);
}

/* ====================================
          CONFIGURACIÓN DE ENV
==================================== */

const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  shutdownTimeoutMs: parsedEnv.data.SHUTDOWN_TIMEOUT_MS,

  database: {
    host: parsedEnv.data.DATABASE_HOST,
    port: parsedEnv.data.DATABASE_PORT,
    name: parsedEnv.data.DATABASE_NAME,
    user: parsedEnv.data.DATABASE_USER,
    password: parsedEnv.data.DATABASE_PASSWORD,
    ssl: parsedEnv.data.DATABASE_SSL,
    sslRejectUnauthorized: parsedEnv.data.DATABASE_SSL_REJECT_UNAUTHORIZED,
    connectionTimeoutMs: parsedEnv.data.DATABASE_CONNECTION_TIMEOUT_MS,
    idleTimeoutMs: parsedEnv.data.DATABASE_IDLE_TIMEOUT_MS,
    statementTimeoutMs: parsedEnv.data.DATABASE_STATEMENT_TIMEOUT_MS,
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
