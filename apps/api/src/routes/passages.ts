import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { getPassageById } from "../services/repository.js";

const passagesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/passages/:passageId", { preHandler: fastify.requireApiKey }, async (request, reply) => {
    const params = z.object({ passageId: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.badRequest("Invalid passageId");

    const passage = await getPassageById(params.data.passageId);
    if (!passage) return reply.notFound("Passage not found");
    return passage;
  });
};

export default passagesRoutes;
