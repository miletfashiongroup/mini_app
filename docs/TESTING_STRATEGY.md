# Testing Strategy & Quality Gates

## Scope & Targets
- **Coverage**: backend ≥70% statements, frontend ≥60% lines; gate enforced in CI (planned) and recommended locally.
- **Types**: type-check frontend (TS) and backend (pydantic/ruff type rules) each PR.
- **Perf smoke**: P95 latency < 500ms on `/api/health` and < 800ms on `/api/products?limit=20` (manual check via k6 recommended on staging).

## Pyramid
1. **Unit** (fast, isolated): domain services, validators.
2. **Integration**: DB/Redis with Alembic schema; order/cart flows.
3. **Contract**: OpenAPI vs frontend generated client (`pnpm generate:api`); keep spec up-to-date.
4. **E2E/Smoke**: `scripts/smoke_manual.sh` (prod-safe) + staging e2e (order lifecycle with test user/db).

## Commands
- Backend unit/integration: `cd packages/backend && poetry run pytest --cov --cov-report=term-missing --cov-fail-under=70`
- Backend lint: `poetry run ruff check .`
- Frontend lint: `cd packages/frontend && pnpm lint`
- Frontend tests: `pnpm test -- --coverage`
- Typecheck: `pnpm typecheck -- --pretty false`
- Contract regen: `pnpm generate:api`

## Data & Fixtures
- Use dedicated test DB `brace_test`; never run destructive tests against prod. Smoke script rejects DB names без `_smoke`.
- Factories: `tests/factories` (backend) cover users/products/orders.

## Quality Gates (to be enforced in CI)
- Lint + typecheck must pass.
- Coverage thresholds as above.
- Docker images must build (`docker compose build backend frontend`).
- Smoke job on staging must pass before prod deploy.

## Reporting
- Pytest: `--junitxml=artifacts/backend-junit.xml` for CI.
- Frontend: `--coverageDirectory artifacts/frontend-coverage`.

## Flaky/Quarantine
- Mark flaky tests with `@pytest.mark.flaky` and track in `tests/FLAKY.md` (create when needed). Remove within 2 sprints.

