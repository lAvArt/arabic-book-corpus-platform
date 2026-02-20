import { GoogleDocAiProvider } from "./googleDocAi.js";
import { MistralOcrProvider } from "./mistral.js";
import { PaddleOcrProvider } from "./paddle.js";
import type { OcrPageResult } from "./types.js";

const MIN_CONFIDENCE = 0.8;

const providers = [new GoogleDocAiProvider(), new MistralOcrProvider(), new PaddleOcrProvider()];

export async function runOcrWithFallback(imageBuffer: Buffer): Promise<OcrPageResult> {
  let lastResult: OcrPageResult | null = null;

  for (const provider of providers) {
    const result = await provider.processPage(imageBuffer);
    lastResult = result;
    if (result.avgConfidence >= MIN_CONFIDENCE) return result;
  }

  if (!lastResult) {
    throw new Error("OCR providers returned no result");
  }
  return lastResult;
}
