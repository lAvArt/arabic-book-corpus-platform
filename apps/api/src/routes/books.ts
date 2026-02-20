import { z } from "zod";
import type { FastifyPluginAsync } from "fastify";
import { listBookEditions, listBooks, searchBook } from "../services/repository.js";

const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

const booksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/books", { preHandler: fastify.requireApiKey }, async () => {
    return listBooks();
  });

  fastify.get(
    "/books/:bookId/editions",
    { preHandler: fastify.requireApiKey },
    async (request, reply) => {
      const params = z.object({ bookId: z.string().uuid() }).safeParse(request.params);
      if (!params.success) return reply.badRequest("Invalid bookId");
      return listBookEditions(params.data.bookId);
    }
  );

  fastify.get(
    "/books/:bookId/search",
    { preHandler: fastify.requireApiKey },
    async (request, reply) => {
      const params = z.object({ bookId: z.string().uuid() }).safeParse(request.params);
      if (!params.success) return reply.badRequest("Invalid bookId");

      const query = searchQuerySchema.safeParse(request.query);
      if (!query.success) return reply.badRequest("Invalid query");

      return searchBook({
        bookId: params.data.bookId,
        queryText: query.data.q,
        limit: query.data.limit,
        offset: query.data.offset
      });
    }
  );
};

export default booksRoutes;
