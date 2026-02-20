# Setup Guide

This guide gets the v1 scaffold running locally.

## Prerequisites

- Node.js 22.x
- Corepack enabled (`corepack enable`)
- pnpm 10.6.2 (managed by Corepack)
- Docker Desktop (or Docker Engine + Compose plugin)
- Optional: `psql` CLI (needed for the hybrid local workflow)

## 1. Configure Environment

From the repo root:

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

Defaults in `.env.example` are valid for local development.
Local Node services load `.env` via `dotenv`.
Docker Compose services currently load `.env.example` (as configured in `docker-compose.yml`), so keep both files aligned if you customize values.

## 2. Choose a Run Mode

### Option A: Full Docker Compose

This runs Postgres, Redis, MinIO, API, worker, Bull Board, and Admin UI in containers.

```bash
docker compose up --build
```

Run the database migration once Postgres is up:

```bash
cat infra/db/migrations/0001_init.sql | docker compose exec -T postgres psql -U postgres -d arabic_corpus
```

On PowerShell:

```powershell
Get-Content -Raw infra/db/migrations/0001_init.sql | docker compose exec -T postgres psql -U postgres -d arabic_corpus
```

### Option B: Hybrid Local Dev (Recommended for coding)

This keeps infra in Docker and runs Node services directly on your machine.

1. Start infra services:

```bash
docker compose up -d postgres redis minio minio-init
```

2. Install dependencies:

```bash
corepack enable
corepack prepare pnpm@10.6.2 --activate
pnpm install
```

3. Apply migration:

```bash
pnpm db:migrate
```

4. Start app services:

```bash
pnpm dev
```

Or run specific services:

```bash
pnpm --filter @arabic-corpus/api dev
pnpm --filter @arabic-corpus/ingest dev
pnpm --filter @arabic-corpus/ingest board
pnpm --filter @arabic-corpus/admin dev
```

## 3. Verify the Setup

Health check:

```bash
curl http://localhost:4000/api/v1/status
```

Expected response:

```json
{"ok":true}
```

Create a local dev API key (uses `x-dev-user-id` in non-production):

```bash
curl -X POST http://localhost:4000/api/v1/auth/keys \
  -H "x-dev-user-id: local-admin" \
  -H "content-type: application/json" \
  -d "{\"name\":\"local-dev\"}"
```

Use the returned `plainTextKey` to call a protected endpoint:

```bash
curl http://localhost:4000/api/v1/books -H "x-api-key: <plainTextKey>"
```

Useful local URLs:

- API: `http://localhost:4000`
- API status: `http://localhost:4000/api/v1/status`
- Bull Board: `http://localhost:4100/queues`
- Admin UI: `http://localhost:3001`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## 4. Optional: Add Minimal Test Data

A fresh database is empty by default. If you want `/books` to return data immediately, run:

```sql
with s as (
  insert into source (slug, title_ar, title_en, author)
  values ('lisan-al-arab', 'Lisan al-Arab', 'Lisan al-Arab', 'Ibn Manzur')
  on conflict (slug) do update
    set title_en = excluded.title_en
  returning id
)
insert into edition (source_id, edition_name, publisher, publication_year, is_canonical)
select s.id, 'Demo Edition', 'Demo Publisher', 2026, true
from s
where not exists (
  select 1
  from edition e
  where e.source_id = s.id and e.edition_name = 'Demo Edition'
);
```

Then retry:

```bash
curl http://localhost:4000/api/v1/books -H "x-api-key: <plainTextKey>"
```

## 5. Current Scaffold Limitations

- OCR providers are stubs in `workers/ingest/src/ocr/*`.
- Admin UI is mostly scaffold UI and not fully wired to live backend workflows.
- Search endpoints require real passage/token data; they will return empty results on a fresh DB.

## 6. Troubleshooting

- `401 Missing x-api-key header`: use `x-api-key` on public read routes.
- `401 Missing or invalid admin session token`: in local dev, add `x-dev-user-id` header for admin endpoints.
- DB connection errors: confirm Postgres is running on `localhost:5432` and `.env` has the correct `DATABASE_URL`.
- Port conflicts: adjust `API_PORT`, `ADMIN_PORT`, or `BULL_BOARD_PORT` in `.env`.
