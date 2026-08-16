import env from "../src/config/env.js";

const expectedEnvironment = process.env.EXPECTED_NODE_ENV;

if (expectedEnvironment && env.nodeEnv !== expectedEnvironment) {
  console.error(
    `Configuration environment mismatch: expected ${expectedEnvironment}, got ${env.nodeEnv}`,
  );
  process.exit(1);
}

const isProductionLike = ["staging", "production"].includes(env.nodeEnv);

if (isProductionLike && !env.database.ssl) {
  console.error("Production-like environments require DATABASE_SSL=true.");
  process.exit(1);
}

console.log(
  JSON.stringify({
    event: "configuration_check_passed",
    nodeEnv: env.nodeEnv,
    port: env.port,
    databaseSsl: env.database.ssl,
    corsDevelopmentOrigin: env.cors.dev,
    corsProductionOrigin: env.cors.production,
    shutdownTimeoutMs: env.shutdownTimeoutMs,
  }),
);
