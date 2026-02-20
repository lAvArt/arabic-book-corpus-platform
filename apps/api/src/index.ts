import { buildApp } from "./app.js";
import { closeDb } from "./db.js";
import { env } from "./config.js";

async function start() {
  const app = buildApp();
  try {
    await app.listen({ host: "0.0.0.0", port: env.API_PORT });
    app.log.info(`API listening on :${env.API_PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }

  const shutdown = async () => {
    app.log.info("Shutting down API...");
    await app.close();
    await closeDb();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

void start();
