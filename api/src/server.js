import path from "node:path";
import { fileURLToPath } from "node:url";

import app from "./app.js";
import { closeDatabasePool, testDatabaseConnection } from "./config/database.js";
import env from "./config/env.js";
import { syncJobQueue } from "./jobs/sync-job.queue.js";
import { markShuttingDown } from "./runtime/app-state.js";
import { logger } from "./utils/logger.js";

let httpServer = null;
let shutdownPromise = null;

export async function startServer() {
  try {
    await testDatabaseConnection();
    await syncJobQueue.start();

    httpServer = await new Promise((resolve, reject) => {
      const instance = app.listen(env.port, () => resolve(instance));
      instance.once("error", reject);
    });

    logger.info("server_started", { port: env.port });
    return httpServer;
  } catch (error) {
    logger.error("server_start_failed", {
      message: error.message,
      stack: error.stack,
    });
    syncJobQueue.stop();
    await closeDatabasePool().catch(() => undefined);
    throw error;
  }
}

export async function shutdownServer(signal = "manual") {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = (async () => {
    markShuttingDown();
    logger.info("server_shutdown_started", { signal });

    syncJobQueue.stop();

    if (httpServer) {
      await new Promise((resolve) => {
        let settled = false;
        const finish = (forced = false) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeout);

          if (forced) {
            logger.warn("server_shutdown_forced", {
              timeoutMs: env.shutdownTimeoutMs,
            });
          }

          resolve();
        };

        const timeout = setTimeout(() => {
          httpServer.closeIdleConnections?.();
          httpServer.closeAllConnections?.();
          finish(true);
        }, env.shutdownTimeoutMs);

        timeout.unref?.();
        httpServer.close(() => finish());
      });
      httpServer = null;
    }

    await closeDatabasePool();
    logger.info("server_shutdown_completed", { signal });
  })();

  return shutdownPromise;
}

process.once("SIGTERM", () => {
  shutdownServer("SIGTERM")
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});

process.once("SIGINT", () => {
  shutdownServer("SIGINT")
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});

const currentFile = path.resolve(fileURLToPath(import.meta.url));
const invokedFile = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedFile === currentFile) {
  startServer().catch(() => process.exit(1));
}
