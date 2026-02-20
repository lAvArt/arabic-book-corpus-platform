import { Pool } from "pg";
import { env } from "./config.js";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10
});

export async function updateStageStatus(params: {
  ingestJobId: string;
  stage: string;
  status: "queued" | "running" | "completed" | "failed";
  pageId?: string;
  error?: string | null;
}): Promise<void> {
  const coalescePageId = params.pageId ?? "00000000-0000-0000-0000-000000000000";
  await db.query(
    `
      insert into ingest_job_stage (
        ingest_job_id,
        page_id,
        stage_name,
        status,
        error_message,
        updated_at
      )
      values ($1, $2, $3, $4, $5, now())
      on conflict (ingest_job_id, coalesce(page_id, '00000000-0000-0000-0000-000000000000'::uuid), stage_name)
      do update set
        status = excluded.status,
        error_message = excluded.error_message,
        updated_at = now()
    `,
    [params.ingestJobId, params.pageId ?? null, params.stage, params.status, params.error ?? null]
  );
}

export async function touchIngestJob(ingestJobId: string, progressPct: number, status: string): Promise<void> {
  await db.query(
    `
      update ingest_job
      set status = $2,
          progress_pct = $3,
          updated_at = now()
      where id = $1
    `,
    [ingestJobId, status, progressPct]
  );
}
