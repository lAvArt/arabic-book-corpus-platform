# Architecture Notes (v1)

## OCR Fallback Order

1. Google Document AI
2. Mistral OCR 3 fallback
3. PaddleOCR fallback

## Queue Stages

1. `import_pages`
2. `run_ocr`
3. `normalize_lines`
4. `segment_passages`
5. `tokenize_passages`
6. `qa_checks`
7. `publish_release`

## Normalization Ownership

- `normalize_lines` writes `page_line.text_normalized`
- `tokenize_passages` writes `token.surface_normalized`
- Search indexes read normalized columns only.

## Search Strategy

- exact token normalized match
- FTS match over passage normalized text
- trigram fallback for noisy OCR variants
