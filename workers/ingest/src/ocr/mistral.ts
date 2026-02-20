import type { OcrPageResult, OcrProvider } from "./types.js";

export class MistralOcrProvider implements OcrProvider {
  name: OcrPageResult["engine"] = "mistral-ocr-3";

  async processPage(_imageBuffer: Buffer): Promise<OcrPageResult> {
    // TODO: integrate with Mistral OCR 3 API.
    return {
      engine: this.name,
      engineVersion: "stub-v1",
      avgConfidence: 0.0,
      lines: [],
      rawPayload: { stub: true }
    };
  }
}
