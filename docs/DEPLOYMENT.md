# Deployment Guide

This project is deployable as a hybrid stack:

- `apps/admin` on Vercel
- Postgres/Auth on Supabase
- `apps/api` and `workers/ingest` on a persistent Node host (Railway or Fly.io)
- Redis on a managed provider (Upstash or Redis Cloud)

It is not Docker-only. Docker Compose is for local development.

## 1. Production Architecture

Use separate services:

1. Supabase Postgres (database)
2. Supabase Auth (admin session tokens)
3. Redis (BullMQ queue + rate-limit counters)
4. API service (`@arabic-corpus/api`)
5. Worker service (`@arabic-corpus/ingest`)
6. Admin UI (`@arabic-corpus/admin`) on Vercel

## 2. Prepare Supabase

1. Create a Supabase project.
2. Copy:
   - project URL (`SUPABASE_URL`)
   - `anon` key (`SUPABASE_ANON_KEY`)
   - service role key (`SUPABASE_SERVICE_ROLE_KEY`)
   - Postgres connection string (`DATABASE_URL`)
3. Run DB migration:

```bash
psql "$DATABASE_URL" -f infra/db/migrations/0001_init.sql
```

Use a connection string with SSL enabled (for example `sslmode=require`) if your provider requires it.

## 3. Provision Redis

Create a Redis instance and get `REDIS_URL`.

The API and worker both require the same Redis instance.

## 4. Environment Variables

Set these in your API and worker hosts.

### API (`apps/api`)

- `NODE_ENV=production`
- `API_PORT` (or set `API_PORT=$PORT` on platforms that inject `PORT`)
- `LOG_LEVEL=info`
- `DATABASE_URL=<supabase postgres url>`
- `REDIS_URL=<managed redis url>`
- `SUPABASE_URL=<supabase project url>`
- `SUPABASE_ANON_KEY=<supabase anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<supabase service role key>`

Optional right now:

- `MINIO_ENDPOINT`
- `MINIO_BUCKET_SCANS`
- `MINIO_BUCKET_OCR`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- OCR provider keys (`GOOGLE_DOC_AI_*`, `MISTRAL_API_KEY`, `PADDLE_OCR_ENDPOINT`)

### Worker (`workers/ingest`)

- `NODE_ENV=production`
- `DATABASE_URL=<supabase postgres url>`
- `REDIS_URL=<managed redis url>`
- `BULL_BOARD_PORT=4100` (only if running Bull Board)

## 5. Deploy API and Worker (Railway)

Create two Railway services from the same repository.

### API service

- Build command:

```bash
pnpm --filter @arabic-corpus/core build && pnpm --filter @arabic-corpus/api build
```

- Start command:

```bash
API_PORT=$PORT pnpm --filter @arabic-corpus/api start
```

### Worker service

- Build command:

```bash
pnpm --filter @arabic-corpus/core build && pnpm --filter @arabic-corpus/ingest build
```

- Start command:

```bash
pnpm --filter @arabic-corpus/ingest start
```

If you want Bull Board as a separate process, create a third service:

- Build command:

```bash
pnpm --filter @arabic-corpus/core build && pnpm --filter @arabic-corpus/ingest build
```

- Start command:

```bash
BULL_BOARD_PORT=$PORT pnpm --filter @arabic-corpus/ingest start:board
```

## 6. Deploy API and Worker (Fly.io Alternative)

The repo includes `infra/fly/api.fly.toml` and `infra/fly/worker.fly.toml`.

Use separate Fly apps and set secrets for each:

```bash
fly secrets set DATABASE_URL=... REDIS_URL=... SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=...
```

And set process commands to run built artifacts for each app:

- API: `pnpm --filter @arabic-corpus/core build && pnpm --filter @arabic-corpus/api build && pnpm --filter @arabic-corpus/api start`
- Worker: `pnpm --filter @arabic-corpus/core build && pnpm --filter @arabic-corpus/ingest build && pnpm --filter @arabic-corpus/ingest start`

## 7. Deploy Admin on Vercel

1. Import this repo in Vercel.
2. Set project Root Directory to `apps/admin`.
3. Framework preset: Next.js.
4. The repo includes `apps/admin/vercel.json` with explicit commands for pnpm workspaces:
   - install: `pnpm install --frozen-lockfile`
   - build: `pnpm --filter @arabic-corpus/admin build`
   - dev: `pnpm --filter @arabic-corpus/admin dev`
5. Add environment variables as needed by future API integration (currently the scaffold UI can run without API vars).
6. Deploy.

## 8. Post-Deploy Verification

1. API health:

```bash
curl https://<api-domain>/api/v1/status
```

2. Create admin API key (non-production shortcut `x-dev-user-id` is disabled in production):
   - send a valid Supabase bearer token to `/api/v1/auth/keys`
3. Verify protected route:

```bash
curl https://<api-domain>/api/v1/books -H "x-api-key: <plainTextKey>"
```

4. Trigger an ingest job and confirm worker consumption.

## 9. Current Production Caveats

- OCR providers are scaffold stubs in `workers/ingest/src/ocr/*`.
- `x-dev-user-id` auth bypass only works when `NODE_ENV != production`.
- Page image signed URLs are not fully implemented yet (`/pages/:pageId/image` currently returns `signedUrl: null`).
