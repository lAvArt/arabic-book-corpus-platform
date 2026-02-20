import { describe, expect, it, vi } from "vitest";
import type { OcrPageResult, OcrProvider } from "../src/ocr/types.js";

function createMockProvider(name: OcrPageResult["engine"], confidence: number): OcrProvider {
    return {
        name,
        processPage: vi.fn(async (): Promise<OcrPageResult> => ({
            engine: name,
            engineVersion: "test-v1",
            avgConfidence: confidence,
            lines: [],
            rawPayload: { mock: true }
        }))
    };
}

// Re-implement the fallback logic in isolation to test without wiring up real providers.
// This mirrors runOcrWithFallback but with injectable providers.
async function runFallbackWith(providers: OcrProvider[], minConfidence = 0.8): Promise<OcrPageResult> {
    let lastResult: OcrPageResult | null = null;
    for (const provider of providers) {
        const result = await provider.processPage(Buffer.from(""));
        lastResult = result;
        if (result.avgConfidence >= minConfidence) return result;
    }
    if (!lastResult) throw new Error("OCR providers returned no result");
    return lastResult;
}

describe("OCR fallback chain", () => {
    it("returns first provider result when confidence is sufficient", async () => {
        const google = createMockProvider("google-doc-ai", 0.95);
        const mistral = createMockProvider("mistral-ocr-3", 0.90);
        const paddle = createMockProvider("paddleocr", 0.85);

        const result = await runFallbackWith([google, mistral, paddle]);
        expect(result.engine).toBe("google-doc-ai");
        expect(google.processPage).toHaveBeenCalledOnce();
        expect(mistral.processPage).not.toHaveBeenCalled();
        expect(paddle.processPage).not.toHaveBeenCalled();
    });

    it("falls back to second provider when first has low confidence", async () => {
        const google = createMockProvider("google-doc-ai", 0.3);
        const mistral = createMockProvider("mistral-ocr-3", 0.92);
        const paddle = createMockProvider("paddleocr", 0.85);

        const result = await runFallbackWith([google, mistral, paddle]);
        expect(result.engine).toBe("mistral-ocr-3");
        expect(google.processPage).toHaveBeenCalledOnce();
        expect(mistral.processPage).toHaveBeenCalledOnce();
        expect(paddle.processPage).not.toHaveBeenCalled();
    });

    it("falls back to third provider when first two have low confidence", async () => {
        const google = createMockProvider("google-doc-ai", 0.2);
        const mistral = createMockProvider("mistral-ocr-3", 0.4);
        const paddle = createMockProvider("paddleocr", 0.88);

        const result = await runFallbackWith([google, mistral, paddle]);
        expect(result.engine).toBe("paddleocr");
    });

    it("returns last provider result when all have low confidence", async () => {
        const google = createMockProvider("google-doc-ai", 0.1);
        const mistral = createMockProvider("mistral-ocr-3", 0.2);
        const paddle = createMockProvider("paddleocr", 0.3);

        const result = await runFallbackWith([google, mistral, paddle]);
        expect(result.engine).toBe("paddleocr");
        expect(result.avgConfidence).toBe(0.3);
        // All providers should have been tried
        expect(google.processPage).toHaveBeenCalledOnce();
        expect(mistral.processPage).toHaveBeenCalledOnce();
        expect(paddle.processPage).toHaveBeenCalledOnce();
    });

    it("throws when provider list is empty", async () => {
        await expect(runFallbackWith([])).rejects.toThrow("OCR providers returned no result");
    });

    it("treats confidence of exactly 0.8 as sufficient", async () => {
        const google = createMockProvider("google-doc-ai", 0.8);
        const mistral = createMockProvider("mistral-ocr-3", 0.95);

        const result = await runFallbackWith([google, mistral]);
        expect(result.engine).toBe("google-doc-ai");
        expect(mistral.processPage).not.toHaveBeenCalled();
    });
});
