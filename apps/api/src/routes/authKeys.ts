import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { createApiKeyForUser, revokeApiKey, rotateApiKey } from "../services/apiKeys.js";

const createSchema = z.object({
  name: z.string().min(2).max(128),
  expiresAt: z.string().datetime().optional().nullable()
});

const authKeysRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/auth/keys", { preHandler: fastify.requireAdminSession }, async (request, reply) => {
    const body = createSchema.safeParse(request.body);
    if (!body.success) return reply.badRequest("Invalid body");
    if (!request.authUserId) return reply.unauthorized();

    const created = await createApiKeyForUser({
      userId: request.authUserId,
      name: body.data.name,
      expiresAt: body.data.expiresAt ?? null
    });
    return created;
  });

  fastify.post(
    "/auth/keys/:keyId/rotate",
    { preHandler: fastify.requireAdminSession },
    async (request, reply) => {
      const params = z.object({ keyId: z.string().uuid() }).safeParse(request.params);
      if (!params.success) return reply.badRequest("Invalid keyId");
      if (!request.authUserId) return reply.unauthorized();

      const rotated = await rotateApiKey({
        userId: request.authUserId,
        keyId: params.data.keyId
      });
      if (!rotated) return reply.notFound("API key not found");
      return rotated;
    }
  );

  fastify.delete(
    "/auth/keys/:keyId",
    { preHandler: fastify.requireAdminSession },
    async (request, reply) => {
      const params = z.object({ keyId: z.string().uuid() }).safeParse(request.params);
      if (!params.success) return reply.badRequest("Invalid keyId");
      if (!request.authUserId) return reply.unauthorized();

      const revoked = await revokeApiKey({
        userId: request.authUserId,
        keyId: params.data.keyId
      });
      if (!revoked) return reply.notFound("API key not found");
      return reply.status(204).send();
    }
  );
};

export default authKeysRoutes;
