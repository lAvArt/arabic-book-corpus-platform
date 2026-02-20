# Public API v1

Base path: `/api/v1`

All public read routes require `x-api-key`.

## Books

- `GET /books`
- `GET /books/{bookId}/editions`
- `GET /books/{bookId}/search?q=...`

## Passages and Pages

- `GET /passages/{passageId}`
- `GET /pages/{pageId}`
- `GET /pages/{pageId}/image`

## Releases

- `GET /releases`

## API Keys

- `POST /auth/keys`
- `POST /auth/keys/{keyId}/rotate`
- `DELETE /auth/keys/{keyId}`

`/auth/*` endpoints require admin session auth (Supabase bearer token or `x-dev-user-id` in non-production).

## Ingestion (Admin)

- `POST /ingest/jobs`
- `GET /ingest/jobs/{jobId}`

## Core Response Types

- `Citation`
- `Anchor`
- `SearchHit`
- `PassageDetail`
- `ReleaseManifest`
