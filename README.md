# Arabic Book Corpus Platform (v1 Scaffold)

Standalone OCR-first platform for digitizing Arabic books (starting with `لسان العرب`) with citation-grade search APIs.

## Scope

- OCR ingestion pipeline with retries and DLQ.
- Canonical citation chain: `edition -> volume -> page -> line -> passage -> token -> bbox`.
- Public versioned API (`/api/v1/*`) with API keys.
- Admin QA app for reviewer workflows.
- Monthly immutable release workflow.

## Monorepo Layout

```text
apps/
  api/            # Fastify API
  admin/          # Next.js reviewer UI
workers/
  ingest/         # BullMQ jobs + Bull Board
packages/
  core/           # Shared types + normalization
  sdk-js/         # Public JS client
infra/
  db/migrations/  # SQL migrations
  fly/            # Fly.io configs
```

## Quick Start

1. Copy `.env.example` to `.env` and adjust values.
2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Run database migration:

   ```bash
   psql "$DATABASE_URL" -f infra/db/migrations/0001_init.sql
   ```

4. Start local stack:

   ```bash
   docker compose up --build
   ```

## API Endpoints (v1)

- `GET /api/v1/books`
- `GET /api/v1/books/:bookId/editions`
- `GET /api/v1/books/:bookId/search?q=...`
- `GET /api/v1/passages/:passageId`
- `GET /api/v1/pages/:pageId`
- `GET /api/v1/pages/:pageId/image`
- `GET /api/v1/releases`
- `POST /api/v1/auth/keys`
- `POST /api/v1/auth/keys/:keyId/rotate`
- `DELETE /api/v1/auth/keys/:keyId`
- `POST /api/v1/ingest/jobs` (admin)
- `GET /api/v1/ingest/jobs/:jobId` (admin)

## Auth Model

- Admin UI: Supabase Auth session.
- Public API: custom API keys (hashed at rest) via Fastify middleware.

## Search Model (v1)

- Exact normalized token match.
- Postgres full-text search on normalized passages.
- `pg_trgm` fallback for OCR/noise tolerance.

## Governance

- Curated maintainer-only ingestion.
- Monthly release manifests + checksums.
- No publish without provenance metadata and QA pass.
