import { spawn } from "node:child_process";
import path from "node:path";

import env from "../src/config/env.js";

const output = process.env.BACKUP_FILE ?? process.argv[2];

if (!output) {
  console.error("Usage: pnpm db:backup -- <backup-file> or BACKUP_FILE=<backup-file>");
  process.exit(1);
}

const backupFile = path.resolve(output);
const args = [
  "--format=custom",
  "--file",
  backupFile,
  "--host",
  env.database.host,
  "--port",
  String(env.database.port),
  "--username",
  env.database.user,
  "--dbname",
  env.database.name,
  "--no-owner",
  "--no-privileges",
];

const child = spawn("pg_dump", args, {
  env: { ...process.env, PGPASSWORD: env.database.password },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to execute pg_dump: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  if (code === 0) {
    console.log(`Database backup created: ${backupFile}`);
  }

  process.exitCode = code ?? 1;
});
