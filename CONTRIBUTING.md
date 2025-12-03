# Contributing to BRACE

## Monorepo Layout
- `packages/backend` — FastAPI service (Python/Poetry) + Alembic migrations.
- `packages/frontend` — Vite + React 18 + Tailwind.
- `packages/shared-api` — Generated TypeScript types from backend OpenAPI (`@brace/shared-api`).

## Getting Started
```bash
cp .env.example .env
pnpm install
pnpm generate:api   # sync TS types with backend OpenAPI
make backend-install frontend-install
make seed           # optional: seed DB with demo data
```

## Development
- Backend: `cd packages/backend && poetry run uvicorn brace_backend.main:app --reload`
- Frontend: `cd packages/frontend && npm run dev -- --host`
- Regenerate API types after backend schema changes: `pnpm generate:api`

## Testing & Quality
- Backend tests: `cd packages/backend && poetry run pytest`
- Frontend: `cd packages/frontend && npm run test`
- Frontend e2e: `cd packages/frontend && pnpm exec playwright test` (set `E2E_BASE_URL`)
- Lint: `pnpm lint`
- Type generation check (CI-friendly): `pnpm generate:api` then ensure `git diff` is empty.

## CI Expectations
- Pipelines run lint + test + typecheck for both frontend and backend.
- OpenAPI → TS types must be up to date (`packages/shared-api/src/index.ts` clean).
- Migrations should be present for DB changes; seeds updated if data shape changes.

## Contribution Flow
1. Create a branch.
2. Make changes + update tests + regenerate types.
3. Ensure `git status` clean after `pnpm generate:api`.
4. Open PR with a concise summary and testing notes.
