import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

const tableNames = [
  "users",
  "refresh_tokens",
  "tcgs",
  "sets",
  "cards",
  "card_prices",
  "collection_items",
  "grading_companies",
  "graded_card_prices",
  "sync_jobs",
];

try {
  const [tables, columns, constraints, indexes] = await Promise.all([
    pool.query(
      `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name
      `,
      [tableNames],
    ),
    pool.query(
      `
        SELECT
          table_name,
          ordinal_position,
          column_name,
          data_type,
          udt_name,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])
        ORDER BY table_name, ordinal_position
      `,
      [tableNames],
    ),
    pool.query(
      `
        SELECT
          cls.relname AS table_name,
          con.conname AS constraint_name,
          CASE con.contype
            WHEN 'p' THEN 'PRIMARY KEY'
            WHEN 'u' THEN 'UNIQUE'
            WHEN 'f' THEN 'FOREIGN KEY'
            WHEN 'c' THEN 'CHECK'
            WHEN 'x' THEN 'EXCLUSION'
            ELSE con.contype::text
          END AS constraint_type,
          pg_get_constraintdef(con.oid) AS definition
        FROM pg_constraint con
        INNER JOIN pg_class cls ON cls.oid = con.conrelid
        INNER JOIN pg_namespace ns ON ns.oid = cls.relnamespace
        WHERE ns.nspname = 'public'
          AND cls.relname = ANY($1::text[])
        ORDER BY cls.relname, constraint_type, con.conname
      `,
      [tableNames],
    ),
    pool.query(
      `
        SELECT tablename AS table_name, indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
        ORDER BY tablename, indexname
      `,
      [tableNames],
    ),
  ]);

  console.log(
    JSON.stringify(
      {
        schema: "public",
        expectedTables: tableNames,
        tables: tables.rows,
        columns: columns.rows,
        constraints: constraints.rows,
        indexes: indexes.rows,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
