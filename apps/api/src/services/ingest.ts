import { randomUUID } from "node:crypto";
import { Queue } from "bullmq";
import { INGEST_QUEUE_NAME, INGEST_STAGES, parseRedisConnection } from "@arabic-corpus/core";
import { env } from "../config.js";
import { query } from "../db.js";

const redisConnection = parseRedisConnection(env.REDIS_URL);

const ingestQueue = new Queue(INGEST_QUEUE_NAME, { connection: redisConnection });

export async function enqueueIngestJob(params: {
  editionId: string;
  createdBy: string;
}): Promise<{ ingestJobId: string }> {
  const ingestJobId = randomUUID();
  await query(
    `
      insert into ingest_job (id, edition_id, status, progress_pct, created_by)
      values ($1, $2, 'queued', 0, $3)
    `,
    [ingestJobId, params.editionId, params.createdBy]
  );

  await ingestQueue.add(
    `${ingestJobId}:${INGEST_STAGES[0]}`,
    {
      jobId: ingestJobId,
      editionId: params.editionId,
      stage: INGEST_STAGES[0]
    },
    { jobId: `${ingestJobId}:${INGEST_STAGES[0]}` }
  );

  return { ingestJobId };
}

export async function getIngestJobById(jobId: string): Promise<{
  id: string;
  status: string;
  progressPct: number;
  editionId: string;
  createdAt: string;
  updatedAt: string;
  stages: Array<{ stageName: string; status: string; errorMessage: string | null; updatedAt: string }>;
} | null> {
  const jobRows = await query<{
    id: string;
    status: string;
    progress_pct: number;
    edition_id: string;
    created_at: string;
    updated_at: string;
  }>(
    `
      select id, status, progress_pct, edition_id, created_at, updated_at
      from ingest_job
      where id = $1
      limit 1
    `,
    [jobId]
  );

  const job = jobRows[0];
  if (!job) return null;

  const stageRows = await query<{
    stage_name: string;
    status: string;
    error_message: string | null;
    updated_at: string;
  }>(
    `
      select stage_name, status, error_message, updated_at
      from ingest_job_stage
      where ingest_job_id = $1
      order by updated_at asc
    `,
    [jobId]
  );

  return {
    id: job.id,
    status: job.status,
    progressPct: Number(job.progress_pct),
    editionId: job.edition_id,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    stages: stageRows.map((row) => ({
      stageName: row.stage_name,
      status: row.status,
      errorMessage: row.error_message,
      updatedAt: row.updated_at
    }))
  };
}
