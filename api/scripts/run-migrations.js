import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pool from "../src/config/database.js";

const migrationsDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations",
);
const migrationLockKey = "tcg_wallet:migrations";

const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_[\w-]+\.sql$/.test(file))
  .sort();

const client = await pool.connect();

try {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [migrationLockKey]);

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_id varchar(255) PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT NOW()
    )
  `);

  const appliedResult = await client.query(
    "SELECT migration_id FROM schema_migrations ORDER BY migration_id",
  );
  const applied = new Set(
    appliedResult.rows.map((migration) => migration.migration_id),
  );

  const pendingFiles = migrationFiles.filter((file) => !applied.has(file));

  if (pendingFiles.length === 0) {
    console.log("No pending migrations.");
  } else {
    for (const migrationFile of pendingFiles) {
      const migrationSql = await readFile(
        path.join(migrationsDirectory, migrationFile),
        "utf8",
      );

      await client.query("BEGIN");

      try {
        await client.query(migrationSql);
        await client.query(
          "INSERT INTO schema_migrations (migration_id) VALUES ($1)",
          [migrationFile],
        );
        await client.query("COMMIT");
        console.log(`Applied migration: ${migrationFile}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock(hashtext($1))", [
    migrationLockKey,
  ]);
  client.release();
  await pool.end();
}
