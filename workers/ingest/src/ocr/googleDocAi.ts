import type { OcrPageResult, OcrProvider } from "./types.js";

export class GoogleDocAiProvider implements OcrProvider {
  name: OcrPageResult["engine"] = "google-doc-ai";

  async processPage(_imageBuffer: Buffer): Promise<OcrPageResult> {
    // TODO: integrate with Document AI OCR processor.
    return {
      engine: this.name,
      engineVersion: "stub-v1",
      avgConfidence: 0.0,
      lines: [],
      rawPayload: { stub: true }
    };
  }
}
