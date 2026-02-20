import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { getPageById } from "../services/repository.js";

const pagesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/pages/:pageId", { preHandler: fastify.requireApiKey }, async (request, reply) => {
    const params = z.object({ pageId: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.badRequest("Invalid pageId");

    const page = await getPageById(params.data.pageId);
    if (!page) return reply.notFound("Page not found");
    return page;
  });

  fastify.get("/pages/:pageId/image", { preHandler: fastify.requireApiKey }, async (request, reply) => {
    const params = z.object({ pageId: z.string().uuid() }).safeParse(request.params);
    if (!params.success) return reply.badRequest("Invalid pageId");

    const page = await getPageById(params.data.pageId);
    if (!page) return reply.notFound("Page not found");

    return {
      pageId: page.id,
      imagePath: page.storage_path,
      // Future: signed URL from Supabase Storage with short TTL.
      signedUrl: null
    };
  });
};

export default pagesRoutes;
