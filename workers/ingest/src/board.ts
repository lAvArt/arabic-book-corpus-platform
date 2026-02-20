import Fastify from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";
import { env } from "./config.js";
import { ingestQueue } from "./queue.js";

const serverAdapter = new FastifyAdapter();
serverAdapter.setBasePath("/queues");

createBullBoard({
  queues: [new BullMQAdapter(ingestQueue)],
  serverAdapter
});

const app = Fastify({ logger: true });
void app.register(serverAdapter.registerPlugin(), {
  prefix: "/queues"
});

void app.listen({ host: "0.0.0.0", port: env.BULL_BOARD_PORT }).then(() => {
  app.log.info(`Bull Board running on :${env.BULL_BOARD_PORT}/queues`);
});
