import app from "./app.js";
import { testDatabaseConnection } from "./config/database.js";
import env from "./config/env.js";
import { logger } from "./utils/logger.js";

const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(env.port, () => {
      logger.info("server_started", { port: env.port });
    });
  } catch (error) {
    logger.error("server_start_failed", { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

startServer();
