# OCR findings — carried over from the first two books

Hard-won results from digitising two Arabic lexicons. Read this before touching
`workers/ingest/src/ocr/`, because several of these findings contradict
assumptions currently baked into that code.

Books: `المعجم المفهرس لألفاظ القرآن` (Abd al-Bāqī, 796 pp, 1-bit scan) and
`المعجم الاشتقاقي المؤصل` (Jabal, 764 pp, born-digital).

---

## 1. Self-reported confidence is not a quality signal

**This is the finding that matters most, and the current code assumes otherwise.**

`workers/ingest/src/ocr/runOcrWithFallback.ts` accepts a provider's output when
`result.avgConfidence >= MIN_CONFIDENCE` (0.8). Measured behaviour on a real
book says that gate does not do what it looks like it does:

- On a **blank** page (zero ink), the engine returned 561 characters of
  fabricated Chinese text about corporate related-party transactions.
  Reproducibly, across two runs.
- Degenerate token loops (`فبغته` repeated 13×) scored **0.93** against
  completely unrelated reference text under a naive similarity metric.
- Two pages returned the model's internal layout JSON
  (`[{"box_2d": …, "label": "table"}]`) instead of transcription.

None of these announce themselves as low-confidence. A confidence threshold
lets all three through.

**What worked instead: external validation.** Check the transcription against
something the engine had no access to. For a Quranic concordance that is the
Quran itself; for a known edition it is that edition's text. Rows that resolve
are kept, rows that do not are *reported*, never silently dropped.

Result: usable output went from ~80% to **96.3%** of rows.

**Recommended change:** replace the `avgConfidence` gate with
`ReferenceCorpus`-based scoring (`workers/ocr-py/src/ocr_py/reference.py`) and
keep `suspicious_ocr()` as a structural guard for the cases where no reference
exists. Where a book genuinely has no reference text, say so and route pages to
human review — do not substitute a confidence number for knowing.

---

## 2. Not every "scanned" book needs OCR

The Jabal lexicon looked like it needed OCR: every mainstream extractor turned
`المعنى المحوري` into `املعنى احملوري`. It did not. The PDF's text layer was
**correct**; extractors apply bidi reordering *inside* multi-codepoint ToUnicode
ligature expansions, reversing them twice.

Reading glyphs in placement order and reversing at *glyph* granularity rather
than *character* granularity extracted all 764 pages in **4 seconds with zero
unmapped glyphs** — for free, with no API and no error rate.

**Always check for a usable text layer before spending money on OCR.**
`pdf_text.py` does this. Four traps documented there:

1. Two different fonts can share one basename (a simple `TrueType` and a
   composite `Type0`); caching one CMap per name silently loses every ligature.
2. `get_texttrace()` emits one entry per codepoint of a ligature expansion —
   naive handling duplicates letters.
3. Do **not** bidi-mirror brackets; the glyph stream already stores them
   correctly and mirroring flips them a second time.
4. Reversing an RTL run also reverses embedded Latin/digit runs — `بحر 4 / 255`
   becomes `552`.

---

## 3. Input format and resolution beat model choice

Same engine, same pages, different delivery:

| input | rows resolved |
|-------|---------------|
| PDF slices | 89.5% |
| 620 dpi greyscale page images | 96.0% |
| **per-page best of both** | **96.3%** |

Neither wins everywhere. Image mode rescued pages the PDF route dropped
entirely (0 rows → ~70); the PDF route won decisively elsewhere (one page:
196/196 rows vs 6/73). `select_best_ocr.py` scores each page and keeps the
winner — that is the shape `runOcrWithFallback` should take.

Two specifics for 1-bit scans:

- The source is already thresholded, so strokes are broken and there is no grey
  left to reason about. Rendering at 2× with a light blur restores anti-aliased
  edges. On the worst page this doubled the usable rows (37 → 73).
- Gemini exposes `media_resolution=ULTRA_HIGH`; resolution is the single
  biggest quality factor on dense letterpress.

---

## 4. Parser bugs cost more than model quality

Three silent data losses, each larger than any gain from switching engines:

- **Half the pages were being discarded.** The engine returns markdown tables
  for some pages and plain text lines for others. A splitter that accepted only
  `|`-delimited rows dropped **405 of 784 pages (52%)** — invisibly, because
  the table pages still parsed. Fixing it: 24,493 → 46,706 rows.
- **Vocalised pages were invisible.** An Arabic-run regex built from bare
  letters never matches a fully vocalised line, because the diacritics break the
  run. Worth another 4,466 rows.
- **A charset built from sampled text was missing `آ`.** The reference corpus
  spells it `ءَا` in Uthmani orthography, so it never appeared in samples —
  while the printed book uses it constantly. A class absent from the charset can
  never be predicted, and nothing errors.

**Lesson: instrument coverage.** Count rows per page and alert on pages that
yield zero. All three of these were found by asking "why did this page produce
nothing?", not by reading model output.

---

## 5. Traps for anyone writing Arabic text pipelines

- **`[ً-ٰ]` contains the Arabic-Indic digits** (U+0660–U+0669). It reads like
  "the diacritics" and silently deletes every number. Write ranges as explicit
  codepoints.
- **Pillow cannot shape Arabic without libraqm.** It renders isolated glyphs
  left-to-right with no error — producing training images that do not match
  their labels. Render through PyMuPDF instead.
- **CTC scans left-to-right; Arabic reads right-to-left.** Labels must be
  reversed before training and reversed back at inference. Get it wrong and loss
  still falls — every output is simply mirrored.
- **Never eyeball shaped Arabic to verify correctness.** `المعنى` and `املعنى`
  are near-indistinguishable rendered. Assert on codepoints
  (`tests/test_pdf_text.py`).

---

## 6. Costs and baselines

- Mistral OCR: roughly \$1 per 1000 pages — about \$0.80 for a 796-page book.
- Gemini 3.7 Flash (released 2026-08-13): \$0.75/\$3.75 per 1M input/output
  tokens introductory, \$1.50/\$7.50 from 2027. Meaningfully pricier per page at
  ULTRA_HIGH resolution; `ocr_gemini.py` records per-page token usage so this
  can be measured rather than guessed.
- Gemini 3.x **removed** `temperature`, `top_p`, `top_k` and `candidate_count`,
  and replaced `thinking_budget` with `thinking_level`. Sending the old fields
  errors.

**Baseline for any new engine: 96.3% of rows resolving.** Beat that before
switching.

---

## 7. Training a custom recogniser

Full guide: `docs/ARABIC_OCR_TRAINING.md`. Summary of what matters:

- Line segmentation on rigid layouts is free (projection profiles, ~90–100
  lines/page). No detector, no annotation budget.
- Synthetic pretraining gives exact labels and unlimited supply; real crops give
  true degradation but need verified labels. Use both.
- **Font realism dominates.** Amiri over any system font for period Naskh.
- Judge only on real-crop CER. Synthetic CER measures how well the model reads
  its own renderer.
- Auto-aligned real labels are not trustworthy: you know which passage a row
  cites, not which fragment was printed, nor how the layout spaced it. A few
  hundred hand-verified lines beat tens of thousands of guesses.

---

## 8. Legal

The source books are third-party copyrighted works (Jabal d. 2015, 4th ed.
2019; Abd al-Bāqī d. 1968; al-ʿAskarī). **This repo is public.** Extracting for
internal processing is one thing; committing scans or derived text publishes
them. `.gitignore` now blocks `*.pdf`, `books/`, `scans/`, OCR caches, dataset
archives and `*-meanings.json`. Settle licensing per work before relaxing any of
that.
