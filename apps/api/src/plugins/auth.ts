import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { resolveApiKey } from "../services/apiKeys.js";
import { enforceDailyRateLimit } from "../services/rateLimit.js";
import { resolveUserIdFromBearerToken } from "../services/supabaseAuth.js";

declare module "fastify" {
  interface FastifyInstance {
    requireApiKey: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdminSession: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    apiPrincipal?: {
      keyId: string;
      ownerUserId: string;
    };
    authUserId?: string;
  }
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate("requireApiKey", async function requireApiKey(request, reply) {
    const raw = request.headers["x-api-key"];
    const candidate = Array.isArray(raw) ? raw[0] : raw;
    if (!candidate) return reply.unauthorized("Missing x-api-key header");

    const principal = await resolveApiKey(candidate);
    if (!principal) return reply.unauthorized("Invalid API key");

    const allowed = await enforceDailyRateLimit(principal.keyId);
    if (!allowed) return reply.tooManyRequests("Daily rate limit reached");

    request.apiPrincipal = principal;
  });

  fastify.decorate("requireAdminSession", async function requireAdminSession(request, reply) {
    const authHeader = request.headers.authorization;
    const userId = await resolveUserIdFromBearerToken(authHeader);
    if (!userId) {
      const devUser = request.headers["x-dev-user-id"];
      if (process.env.NODE_ENV !== "production" && typeof devUser === "string" && devUser.length > 0) {
        request.authUserId = devUser;
        return;
      }
      return reply.unauthorized("Missing or invalid admin session token");
    }
    request.authUserId = userId;
  });
};

export default fp(authPlugin, { name: "auth-plugin" });
