import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { enqueueIngestJob, getIngestJobById } from "../services/ingest.js";

const createJobSchema = z.object({
  editionId: z.string().uuid()
});

const ingestRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/ingest/jobs", { preHandler: fastify.requireAdminSession }, async (request, reply) => {
    const body = createJobSchema.safeParse(request.body);
    if (!body.success) return reply.badRequest("Invalid body");
    if (!request.authUserId) return reply.unauthorized();

    return enqueueIngestJob({
      editionId: body.data.editionId,
      createdBy: request.authUserId
    });
  });

  fastify.get("/ingest/jobs/:jobId", { preHandler: fastify.requireAdminSession }, async (request, reply) => {
    const params = z.object({ jobId: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.badRequest("Invalid jobId");
    const job = await getIngestJobById(params.data.jobId);
    if (!job) return reply.notFound("Ingest job not found");
    return job;
  });
};

export default ingestRoutes;
