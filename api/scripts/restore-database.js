import { spawn } from "node:child_process";
import path from "node:path";

import env from "../src/config/env.js";

const backupInput = process.env.BACKUP_FILE ?? process.argv[2];
const confirmation = process.env.CONFIRM_RESTORE ?? process.argv[3];

if (!backupInput || confirmation !== "RESTORE") {
  console.error(
    "Usage: CONFIRM_RESTORE=RESTORE pnpm db:restore -- <backup-file> RESTORE",
  );
  process.exit(1);
}

const backupFile = path.resolve(backupInput);
const args = [
  "--clean",
  "--if-exists",
  "--no-owner",
  "--no-privileges",
  "--host",
  env.database.host,
  "--port",
  String(env.database.port),
  "--username",
  env.database.user,
  "--dbname",
  env.database.name,
  backupFile,
];

const child = spawn("pg_restore", args, {
  env: { ...process.env, PGPASSWORD: env.database.password },
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(`Unable to execute pg_restore: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  if (code === 0) {
    console.log(`Database restore completed from: ${backupFile}`);
  }

  process.exitCode = code ?? 1;
});
