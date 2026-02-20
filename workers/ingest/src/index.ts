import { Worker } from "bullmq";
import { INGEST_QUEUE_NAME, INGEST_STAGES, type IngestJobPayload } from "@arabic-corpus/core";
import { ingestQueue, redisConnection } from "./queue.js";
import { runIngestStage } from "./stages.js";
import { touchIngestJob, updateStageStatus } from "./db.js";

function nextStage(current: IngestJobPayload["stage"]): IngestJobPayload["stage"] | null {
  const currentIndex = INGEST_STAGES.indexOf(current);
  if (currentIndex < 0 || currentIndex === INGEST_STAGES.length - 1) return null;
  return INGEST_STAGES[currentIndex + 1];
}

const worker = new Worker<IngestJobPayload>(
  INGEST_QUEUE_NAME,
  async (job) => {
    const payload = job.data;
    await updateStageStatus({
      ingestJobId: payload.jobId,
      pageId: payload.pageId,
      stage: payload.stage,
      status: "running"
    });

    await runIngestStage(payload);

    const currentIndex = INGEST_STAGES.indexOf(payload.stage);
    const progressPct = ((currentIndex + 1) / INGEST_STAGES.length) * 100;
    await updateStageStatus({
      ingestJobId: payload.jobId,
      pageId: payload.pageId,
      stage: payload.stage,
      status: "completed"
    });
    await touchIngestJob(payload.jobId, progressPct, "running");

    const stage = nextStage(payload.stage);
    if (stage) {
      await ingestQueue.add(
        `${payload.jobId}:${stage}`,
        { ...payload, stage },
        { jobId: `${payload.jobId}:${payload.pageId ?? "global"}:${stage}` }
      );
    } else {
      await touchIngestJob(payload.jobId, 100, "completed");
    }
  },
  {
    connection: redisConnection,
    concurrency: 4
  }
);

worker.on("failed", async (job, error) => {
  if (!job) return;
  const payload = job.data;
  await updateStageStatus({
    ingestJobId: payload.jobId,
    pageId: payload.pageId,
    stage: payload.stage,
    status: "failed",
    error: error.message
  });
  await touchIngestJob(payload.jobId, job.progress as number || 0, "failed");
});

worker.on("ready", () => {
  console.log("[ingest-worker] Worker ready");
});

async function shutdown() {
  await worker.close();
  await ingestQueue.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
