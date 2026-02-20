import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import authPlugin from "./plugins/auth.js";
import booksRoutes from "./routes/books.js";
import pagesRoutes from "./routes/pages.js";
import passagesRoutes from "./routes/passages.js";
import releasesRoutes from "./routes/releases.js";
import authKeysRoutes from "./routes/authKeys.js";
import healthRoutes from "./routes/health.js";
import ingestRoutes from "./routes/ingest.js";
import { env } from "./config.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL
    }
  });

  app.register(cors, { origin: true });
  app.register(sensible);
  app.register(authPlugin);

  app.register(async (v1) => {
    v1.register(healthRoutes);
    v1.register(booksRoutes);
    v1.register(passagesRoutes);
    v1.register(pagesRoutes);
    v1.register(releasesRoutes);
    v1.register(authKeysRoutes);
    v1.register(ingestRoutes);
  }, { prefix: "/api/v1" });

  return app;
}
