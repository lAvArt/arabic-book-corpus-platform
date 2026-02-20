# Arabic Book Corpus Platform (v1 Scaffold)

Standalone OCR-first platform for digitizing Arabic books (starting with `Lisan al-Arab`) and serving citation-grade search APIs.

Status: active scaffold. API, worker, and admin apps are in place; OCR providers are currently stubbed.

## Keywords

Arabic corpus, Arabic OCR, Lisan al-Arab, digital humanities, citation search, full-text search, Fastify, BullMQ, Postgres, MinIO, Supabase

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

Use the full setup guide: `docs/SETUP.md`

Minimal quick start:

1. Copy `.env.example` to `.env` (local scripts use `.env`; Docker Compose currently uses `.env.example`).
2. Install dependencies: `pnpm install`.
3. Run migration: `pnpm db:migrate`.
4. Start services: `pnpm dev` or `docker compose up --build`.

## Documentation

- Setup: `docs/SETUP.md`
- API: `docs/API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Governance: `docs/GOVERNANCE.md`
- Search gold set: `docs/GOLD_SET.md`

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

## Development

- Install deps: `pnpm install`
- Dev all services: `pnpm dev`
- Build: `pnpm build`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`

## Auth Model

- Admin UI: Supabase Auth session (or `x-dev-user-id` in non-production).
- Public API: custom API keys (hashed at rest) via Fastify middleware.

## Search Model (v1)

- Exact normalized token match.
- Postgres full-text search on normalized passages.
- `pg_trgm` fallback for OCR/noise tolerance.

## Governance

- Curated maintainer-only ingestion.
- Monthly release manifests plus checksums.
- No publish without provenance metadata and QA pass.

## Contributing and Security

- Contributing guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`

## License

This repository is currently `UNLICENSED`.

