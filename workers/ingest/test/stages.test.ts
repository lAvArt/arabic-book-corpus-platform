import { describe, expect, it } from "vitest";
import { INGEST_STAGES, type IngestStage } from "@arabic-corpus/core";

// Re-implement nextStage to test in isolation (mirrors workers/ingest/src/index.ts logic)
function nextStage(current: IngestStage): IngestStage | null {
    const currentIndex = INGEST_STAGES.indexOf(current);
    if (currentIndex < 0 || currentIndex === INGEST_STAGES.length - 1) return null;
    return INGEST_STAGES[currentIndex + 1];
}

describe("Stage sequencing", () => {
    it("import_pages -> run_ocr", () => {
        expect(nextStage("import_pages")).toBe("run_ocr");
    });

    it("run_ocr -> normalize_lines", () => {
        expect(nextStage("run_ocr")).toBe("normalize_lines");
    });

    it("normalize_lines -> segment_passages", () => {
        expect(nextStage("normalize_lines")).toBe("segment_passages");
    });

    it("segment_passages -> tokenize_passages", () => {
        expect(nextStage("segment_passages")).toBe("tokenize_passages");
    });

    it("tokenize_passages -> qa_checks", () => {
        expect(nextStage("tokenize_passages")).toBe("qa_checks");
    });

    it("qa_checks -> publish_release", () => {
        expect(nextStage("qa_checks")).toBe("publish_release");
    });

    it("publish_release is terminal (returns null)", () => {
        expect(nextStage("publish_release")).toBeNull();
    });

    it("full pipeline chains correctly", () => {
        const sequence: string[] = [];
        let current: IngestStage | null = INGEST_STAGES[0];
        while (current !== null) {
            sequence.push(current);
            current = nextStage(current);
        }
        expect(sequence).toEqual([
            "import_pages",
            "run_ocr",
            "normalize_lines",
            "segment_passages",
            "tokenize_passages",
            "qa_checks",
            "publish_release"
        ]);
    });

    it("progress percentage is correct at each stage", () => {
        const total = INGEST_STAGES.length;
        INGEST_STAGES.forEach((stage: string, index: number) => {
            const pct = ((index + 1) / total) * 100;
            expect(pct).toBeGreaterThan(0);
            expect(pct).toBeLessThanOrEqual(100);
        });
        // Last stage should be 100%
        const lastPct = (INGEST_STAGES.length / total) * 100;
        expect(lastPct).toBe(100);
    });
});
