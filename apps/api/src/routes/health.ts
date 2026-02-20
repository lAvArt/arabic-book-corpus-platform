import type { FastifyPluginAsync } from "fastify";
import { db } from "../db.js";

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/status", async () => {
    await db.query("select 1");
    return { ok: true };
  });
};

export default healthRoutes;
