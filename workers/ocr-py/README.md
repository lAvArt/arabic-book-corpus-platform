# ocr-py — OCR sidecar

Python tooling for page rendering, line segmentation, OCR backends and training
data generation. Invoked by `workers/ingest`; not a rewrite target.

## Why Python and not TypeScript

These modules lean on PyMuPDF for work with no solid JS equivalent:

- **Ligature-correct text extraction.** Some born-digital Arabic PDFs carry a
  correct text layer that every mainstream extractor mangles (`المعنى` comes out
  as `املعنى`). The cause is bidi reordering applied *inside* multi-codepoint
  ToUnicode ligature expansions. Fixing it needs glyph-level access to the
  font's CMap — see `pdf_text.py`. On a 764-page book this took extraction from
  unusable to zero unmapped glyphs in 4 seconds, and removed the need to OCR
  that book at all.
- **Projection-profile line segmentation.** Rigid printed layouts segment into
  clean line crops with numpy alone — no neural detector, no annotation.

## Layout

    src/ocr_py/
      pdf_text.py            ligature-correct extraction from born-digital PDFs
      reference.py           pluggable validator protocol (read this first)
      ocr_mistral.py         Mistral OCR backend, disk-cached per page
      ocr_gemini.py          Gemini backend, promptable + structured rows
      select_best_ocr.py     per-page winner across engines, by measured quality
      build_compare_pdf.py   side-by-side scan vs OCR, for human proofing
      export_training_data.py  real line crops + synthetic line generation
      prepare_dataset.py     package a training set
    tests/
      test_pdf_text.py       asserts exact codepoints, never appearance

## Setup

    python -m venv .venv && .venv/Scripts/activate    # or bin/activate
    pip install -r requirements.txt
    python tests/test_pdf_text.py                     # needs a source PDF

## The one rule

Never trust an engine's self-reported confidence. See `reference.py`.
