import pg from "pg";
import env from "./env.js";

const { Pool } = pg;

const pool = new Pool({
  host: env.database.host,
  port: env.database.port,
  database: env.database.name,
  user: env.database.user,
  password: env.database.password,
});

export const testDatabaseConnection = async () => {
  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("Database connection successful");
  } finally {
    client.release();
  }
};

export default pool;
