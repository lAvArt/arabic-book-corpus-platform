import { describe, expect, it } from "vitest";
import { INGEST_QUEUE_NAME, INGEST_STAGES, type IngestJobPayload, type IngestStage } from "../src/queue.js";

describe("queue constants", () => {
    it("defines exactly 7 pipeline stages in order", () => {
        expect(INGEST_STAGES).toEqual([
            "import_pages",
            "run_ocr",
            "normalize_lines",
            "segment_passages",
            "tokenize_passages",
            "qa_checks",
            "publish_release"
        ]);
    });

    it("starts with import_pages and ends with publish_release", () => {
        expect(INGEST_STAGES[0]).toBe("import_pages");
        expect(INGEST_STAGES[INGEST_STAGES.length - 1]).toBe("publish_release");
    });

    it("has a non-empty queue name", () => {
        expect(INGEST_QUEUE_NAME.length).toBeGreaterThan(0);
    });

    it("IngestJobPayload shape is valid", () => {
        const payload: IngestJobPayload = {
            jobId: "abc-123",
            editionId: "def-456",
            stage: "run_ocr"
        };
        expect(payload.stage satisfies IngestStage).toBe("run_ocr");
        expect(payload.pageId).toBeUndefined();
    });

    it("IngestJobPayload accepts optional pageId", () => {
        const payload: IngestJobPayload = {
            jobId: "abc-123",
            editionId: "def-456",
            stage: "run_ocr",
            pageId: "page-789"
        };
        expect(payload.pageId).toBe("page-789");
    });
});
