import type { OcrPageResult, OcrProvider } from "./types.js";

export class PaddleOcrProvider implements OcrProvider {
  name: OcrPageResult["engine"] = "paddleocr";

  async processPage(_imageBuffer: Buffer): Promise<OcrPageResult> {
    // TODO: integrate with PaddleOCR service endpoint.
    return {
      engine: this.name,
      engineVersion: "stub-v1",
      avgConfidence: 0.0,
      lines: [],
      rawPayload: { stub: true }
    };
  }
}
