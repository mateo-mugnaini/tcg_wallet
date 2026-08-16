import pg from "pg";
import env from "./env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

const pool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
  ssl: env.database.ssl
    ? { rejectUnauthorized: env.database.sslRejectUnauthorized }
    : false,
  connectionTimeoutMillis: env.database.connectionTimeoutMs,
  idleTimeoutMillis: env.database.idleTimeoutMs,
  statement_timeout: env.database.statementTimeoutMs,
});

export const testDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    logger.info("database_connection_successful");
  } finally {
    client.release();
  }
};

export default pool;
