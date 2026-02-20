export interface OcrWord {
  text: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: OcrWord["bbox"];
  words: OcrWord[];
}

export interface OcrPageResult {
  engine: "google-doc-ai" | "mistral-ocr-3" | "paddleocr";
  engineVersion: string;
  avgConfidence: number;
  lines: OcrLine[];
  rawPayload: unknown;
}

export interface OcrProvider {
  name: OcrPageResult["engine"];
  processPage(imageBuffer: Buffer): Promise<OcrPageResult>;
}
