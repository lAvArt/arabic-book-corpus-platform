import { randomUUID } from "node:crypto";
import { INGEST_STAGES } from "@arabic-corpus/core";
import { ingestQueue } from "./queue.js";
import { db } from "./db.js";

async function main() {
  const editionId = process.argv[2];
  if (!editionId) {
    throw new Error("Usage: pnpm --filter @arabic-corpus/ingest enqueue <editionId>");
  }

  const ingestJobId = randomUUID();
  await db.query(
    `
      insert into ingest_job (id, edition_id, status, progress_pct)
      values ($1, $2, 'queued', 0)
    `,
    [ingestJobId, editionId]
  );

  await ingestQueue.add(
    `${ingestJobId}:${INGEST_STAGES[0]}`,
    {
      jobId: ingestJobId,
      editionId,
      stage: INGEST_STAGES[0]
    },
    { jobId: `${ingestJobId}:${INGEST_STAGES[0]}` }
  );

  console.log(`Queued ingest job ${ingestJobId} for edition ${editionId}`);
}

void main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await ingestQueue.close();
    await db.end();
  });
