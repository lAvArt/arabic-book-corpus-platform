export const INGEST_QUEUE_NAME = "ingest_pipeline";

export const INGEST_STAGES = [
  "import_pages",
  "run_ocr",
  "normalize_lines",
  "segment_passages",
  "tokenize_passages",
  "qa_checks",
  "publish_release"
] as const;

export type IngestStage = (typeof INGEST_STAGES)[number];

export interface IngestJobPayload {
  jobId: string;
  editionId: string;
  stage: IngestStage;
  pageId?: string;
}
