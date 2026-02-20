import { Queue, type ConnectionOptions } from "bullmq";
import { INGEST_QUEUE_NAME } from "@arabic-corpus/core";
import { env } from "./config.js";

const redisUrl = new URL(env.REDIS_URL);
export const redisConnection: ConnectionOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || "6379"),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined
};

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
