# Contributing

Thanks for contributing to the Arabic Book Corpus Platform.

## Prerequisites

- Node.js 22.x
- pnpm 10.6.2
- Docker (for local infra)

Setup instructions: `docs/SETUP.md`

## Development Workflow

1. Create a branch from `main`.
2. Make focused, scoped changes.
3. Run checks before opening a PR.

## Local Checks

Run from repo root:

```bash
pnpm typecheck
pnpm test
pnpm build
```

If your change affects only one workspace, run targeted commands when possible:

```bash
pnpm --filter @arabic-corpus/api test
pnpm --filter @arabic-corpus/core test
```

## Pull Request Expectations

- Describe what changed and why.
- Note any schema, API, or env var changes.
- Link related issues.
- Include screenshots for admin UI changes.
- Update docs when behavior changes.

## Commit Guidance

- Keep commit messages clear and imperative.
- Prefer small commits over large mixed commits.
- Avoid committing secrets or local `.env` files.
