import { Queue } from "bullmq";
import { INGEST_QUEUE_NAME, parseRedisConnection } from "@arabic-corpus/core";
import { env } from "./config.js";

export const redisConnection = parseRedisConnection(env.REDIS_URL);

export const ingestQueue = new Queue(INGEST_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5_000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});
