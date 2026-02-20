import type { IngestJobPayload } from "@arabic-corpus/core";
import { runOcrWithFallback } from "./ocr/runOcrWithFallback.js";

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runIngestStage(payload: IngestJobPayload): Promise<void> {
  // Placeholder stage handlers. Each stage should be replaced with concrete OCR,
  // segmentation, tokenization, and QA logic in iterative implementation.
  switch (payload.stage) {
    case "import_pages":
    case "run_ocr":
      // TODO: replace placeholder buffer with page image bytes from object storage.
      await runOcrWithFallback(Buffer.from(""));
      await pause(200);
      return;
    case "normalize_lines":
    case "segment_passages":
    case "tokenize_passages":
    case "qa_checks":
    case "publish_release":
      await pause(200);
      return;
    default:
      throw new Error(`Unsupported ingest stage: ${String(payload.stage)}`);
  }
}
