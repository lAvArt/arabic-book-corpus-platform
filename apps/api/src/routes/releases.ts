import type { FastifyPluginAsync } from "fastify";
import { listReleases } from "../services/repository.js";

const releasesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/releases", { preHandler: fastify.requireApiKey }, async () => {
    return listReleases();
  });
};

export default releasesRoutes;
