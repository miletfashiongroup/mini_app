# BRACE — Telegram Mini App Commerce Monorepo

BRACE is a production-ready monorepo for a Telegram Mini App that sells premium men's underwear. The repository bundles a FastAPI backend, a Vite + React frontend optimized for Telegram WebApp, infrastructure-as-code, CI/CD pipelines, and deployment playbooks so the project is deployable immediately.

## Tech Stack
- **Frontend**: Vite, React 18, TypeScript, TailwindCSS, TanStack Query, Zustand, Telegram WebApp SDK
- **Backend**: FastAPI, async SQLAlchemy (psycopg 3 async driver), PostgreSQL, Redis-backed SlowAPI rate limiting, Alembic
- **Infra**: Docker, docker-compose, Redis, nginx, GitHub Actions, Makefile helpers
- **Security**: Telegram initData HMAC validation, DOMPurify, rate limiting, strict CORS

## Repository Layout
```
packages/
  backend/        # FastAPI service + Alembic + tests + Dockerfile
  frontend/       # Vite React client + Tailwind + Dockerfile
infra/
  docker-compose.prod.yml
  nginx/app.conf
scripts/run-smoke.sh
.github/workflows/ci.yml
README.md, README-verify.md, DEPLOY.md, CHANGELOG.md, POSTMORTEM.md
.env.example
```

## Key Features
- Telegram initData verification middleware and `/api/verify-init` probe
- Product, cart, order, and profile APIs with async PostgreSQL
- 11 fully responsive Telegram-focused screens (home, catalog, product, size UX, profile, cart, etc.)
- Dockerized services (backend, frontend, PostgreSQL) runnable via one compose command
- GitHub Actions pipeline (lint → typecheck → test → build → deploy placeholder)
- Comprehensive documentation: quickstart, verification, deployment, change-log, postmortem templates

## Quickstart
1. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Populate `BRACE_TELEGRAM_BOT_TOKEN`, database credentials, and the `VITE_*` URLs that the frontend will embed (`VITE_API_BASE_URL`, `VITE_APP_BASE_URL`, `VITE_ENV`). The backend now auto-loads `.env` from the monorepo root even when commands are executed inside `packages/backend`; override the lookup via `BRACE_ENV_FILE=/path/to/.env` if you keep secrets elsewhere.  # PRINCIPAL-FIX
2. **Install toolchains**
   ```bash
   make backend-install frontend-install
   ```
3. **Provision local data stores**  
   The backend & pytest suites expect PostgreSQL and Redis. Start the infra stack once:
   ```bash
   docker compose -f infra/docker-compose.prod.yml up -d db redis
   ```
4. **Backend development loop**
   ```bash
   cd packages/backend
   poetry run alembic upgrade head
   poetry run python -m brace_backend.services.seed
   poetry run uvicorn brace_backend.main:app --reload
   ```
   The API is available at `http://localhost:8000/api/health`.
5. **Frontend development loop**
   ```bash
   cd packages/frontend
   pnpm dev -- --host
   ```
   Visit `http://localhost:4173`; Vite proxies API calls to the backend URL from `.env`.
   Regenerate shared API types if backend schema changed:
   ```bash
   pnpm generate:api
   ```
6. **Full stack via Docker Compose**
   ```bash
   make docker-up          # build + run backend, frontend, postgres, redis
   make docker-logs        # follow backend/frontend logs
   make docker-down        # stop stack and wipe volumes
   ```
   Frontend is served at `http://localhost`, backend at `http://localhost:8000`.
   Observability stack (Netdata + Sentry) поднимается отдельно: `docker compose -f infra/docker-compose.observability.yml up -d`; Sentry UI — `http://<host>:9000` (без nginx proxy), health — `/ _health/`.
7. **Smoke tests / CI validation**
   ```bash
   make smoke
   # or directly:
   docker compose -f infra/docker-compose.prod.yml --profile smoke up --build smoke-tests
   ```
   The smoke runner resets PostgreSQL, seeds fixtures, hits all public APIs, checks the frontend, and exits non‑zero on any failure. Set `SMOKE_DATABASE_URL` to a dedicated `brace_smoke` database; the runner now refuses to touch databases whose name does not end with `_smoke` to avoid truncating production data.  # PRINCIPAL-FIX

## Environment Variables
`.env.example` is the single source of truth for configuration. It contains safe defaults for local dev and comments for production.
Frontend reads **only** `VITE_*` build-time variables (runtime `public/config.js` is not used).

| Variable | Purpose | Default |
| --- | --- | --- |
| `BRACE_ENVIRONMENT` | App environment | `development` |
| `BRACE_DATABASE_URL` | Async SQLAlchemy DSN for the app | `postgresql+psycopg_async://postgres:postgres@db:5432/brace` |
| `ALEMBIC_DATABASE_URL` | Sync DSN used by Alembic/entrypoint migrations | `postgresql+psycopg://postgres:postgres@db:5432/brace` |
| `BRACE_REDIS_URL` | SlowAPI limiter storage | `memory://` locally, overridden to `redis://redis:6379/0` inside Docker |
| `BRACE_TELEGRAM_BOT_TOKEN` | Required for initData validation | _(set per BotFather)_ |
| `BRACE_TELEGRAM_DEV_FALLBACK_TOKEN` | Dev-only token when `BRACE_ALLOW_DEV_MODE=true` and `BRACE_TELEGRAM_DEV_MODE=true` | `dev-telegram-token` |
| `BRACE_ALLOW_DEV_MODE` | Allow dev shortcuts (never in prod) | `false` |
| `BRACE_TELEGRAM_DEV_MODE` | Enable dev Telegram mode | `false` |
| `BRACE_PII_ENCRYPTION_KEY` | PII encryption key (required in prod) | _(set per env)_ |
| `BRACE_CORS_ORIGINS` | Allowed origins array | `["http://localhost","http://localhost:4173"]` |
| `BRACE_RATE_LIMIT` | API rate limit string | `60/minute` |
| `VITE_API_BASE_URL` | API base URL compiled into the frontend bundle | `http://localhost:8000` |
| `VITE_APP_BASE_URL` | Public frontend URL for Telegram `/setdomain` | `http://localhost:4173` |
| `VITE_ENV` | Build-time env flag (`dev/stage/prod`) | `dev` |
| `SMOKE_DATABASE_URL` | Async DSN **dedicated** to smoke tests (must contain `brace_smoke`) | `postgresql+asyncpg://postgres:postgres@localhost:5432/brace_smoke` |
| `POSTGRES_USER/PASSWORD/DB` | Docker Compose Postgres bootstrap | `postgres / postgres / brace` |

For the full list (including optional analytics, admin, and build flags), see `.env.example` and `ENV_VARIABLES.md`.

## API Surface
| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Service heartbeat |
| `GET /api/products`, `GET /api/products/:id` | Catalog data |
| `GET/POST/DELETE /api/cart` | Telegram-authenticated cart operations |
| `GET/POST /api/orders` | Checkout and history |
| `GET /api/users/me` | Upsert + fetch Telegram user profile |
| `POST /api/verify-init` | Validate Telegram WebApp init data |

Refer to `packages/backend/tests` for usage examples.

## Testing
- Manual smoke: `API_URL=http://localhost:8000 bash scripts/smoke_manual.sh` (расширяйте под ваши сценарии)

- Manual smoke:  (расширяйте под ваши сценарии)

- Manual smoke:  (расширяйте под ваши сценарии)

- **Backend unit/integration**: `make backend-test` (requires PostgreSQL reachable at `postgresql://postgres:postgres@localhost:5432/brace_test`; run `docker compose -f infra/docker-compose.prod.yml up -d db redis` beforehand).
- **Frontend lint/unit**: `cd packages/frontend && pnpm lint && pnpm test`.
- **Smoke/e2e**: `make smoke` (wraps `infra/docker-compose.smoke.yml`) or `docker compose -f infra/docker-compose.prod.yml --profile smoke up --abort-on-container-exit smoke-tests`.

## Quality Checks & Hooks
- Install Git hooks once with `cd packages/frontend && npm run prepare`; Husky wires `.husky/pre-commit` in the repo root.
- Every commit now runs `lint-staged` (ESLint + Prettier for staged TS/TSX, Prettier for other frontend assets, Ruff with `--fix` for staged Python), a full `poetry run ruff check . --fix`, and `pnpm typecheck -- --pretty false`. Hooks abort commits on the first error so you can fix issues before CI.
- Manual commands mirror CI:
  - Backend lint: `cd packages/backend && poetry run ruff check . --output-format=github`
  - Frontend typecheck: `cd packages/frontend && pnpm typecheck -- --pretty false`
- `lint-staged` configuration lives in `lint-staged.config.js` so you can add more patterns if new packages appear.

## Troubleshooting Quality Failures
- **Ruff auto-fix applied but lint still fails**  
  Run `cd packages/backend && poetry run ruff check . --fix --exit-non-zero-on-fix` to apply remaining fixes, then re-run the command without `--fix` to ensure no diagnostics remain. If Ruff reports an import that should be ignored, extend `tool.ruff.lint.ignore` in `pyproject.toml`.
- **TypeScript compilation errors**  
  1. Execute `cd packages/frontend && pnpm typecheck -- --pretty false` to get deterministic output (the CI command).  
  2. Jump to the file referenced by `tsc` and fix the type annotations; use the `components['schemas'][...]` helpers from `src/shared/api/generated.ts` whenever possible.  
  3. If the issue is module resolution, confirm the `@/*` alias inside `packages/frontend/tsconfig.json` covers your path.  
  4. Re-run `pnpm typecheck` before committing.  
- **Pre-commit fails without actionable logs**  
  Re-run `npx --prefix packages/frontend lint-staged --config lint-staged.config.js --cwd . --debug` to see how files are batched.

## Security & Compliance
- initData is required on all protected routes via the `X-Telegram-Init-Data` header.
- FastAPI dependency verifies signature + freshness (5 minute TTL) via HMAC-SHA256.
- Production boot fails if `BRACE_TELEGRAM_BOT_TOKEN` is missing; dev-only fallback token works only when both `BRACE_ALLOW_DEV_MODE=true` and `BRACE_TELEGRAM_DEV_MODE=true`.
- nginx only exposes port 80; backend stays inside Docker network.
- DOMPurify sanitizes dynamic text pages client-side.
- SlowAPI enforces `60/minute` rate limit per IP; adjust via `BRACE_RATE_LIMIT`.
- Rate-limit counters are kept in Redis (Compose) with an automatic in-memory fallback for local development.
- No secrets are committed; all sensitive data lives in `.env` or CI secrets.

## CI/CD Overview
GitHub Actions pipeline (`.github/workflows/ci.yml`):
1. **quality-gate** — Ruff (Python) + `npm run typecheck` with cached deps to fail fast
2. **lint** — ESLint for frontend
3. **test** — pytest (backend) and React Testing Library placeholders (extend as needed)
4. **build** — Docker build for backend & frontend images
5. **deploy** — shell stage ready for integration with Render/Railway (uses protected secret gates)

## Как включить CI/CD
- В GitHub Secrets добавьте: `STAGING_HOST`, `STAGING_SSH_KEY`, `STAGING_PATH` (staging), `PROD_HOST`, `PROD_SSH_KEY`, `PROD_PATH` (prod), `LHCI_GITHUB_APP_TOKEN` (опционально для Lighthouse), `REGISTRY_USER/REGISTRY_PASSWORD` если потребуется docker push.
- Workflows: `ci.yml` (tests+build+optional lighthouse), `staging.yml` (push main/dispatch → `scripts/deploy_staging.sh`), `prod.yml` (tag v* → `scripts/prod_backup_and_deploy.sh` с шагами precheck/deploy/alembic).
- Включите защиту ветки `main` (см. `docs/BRANCH_PROTECTION.md`) и разрешите только PR-мерджи.
- Secrets/host placeholders оставлены пустыми, поэтому deploy-джобы просто пропускаются до их заполнения.

## Telegram Mini App Integration
1. Create a bot via [@BotFather](https://t.me/BotFather) and capture `BOT_TOKEN`.
2. Generate a WebApp via `/setdomain` and `/newapp`, pointing to the deployed frontend URL (`FRONTEND_URL`).
3. Configure the backend URL (`BACKEND_URL`) as the Mini App’s data source for API calls.
4. Populate `.env`:
   ```env
   BRACE_TELEGRAM_BOT_TOKEN=<BOT_TOKEN>
   BRACE_CORS_ORIGINS=["https://your-frontend-host", "http://localhost"]
   VITE_API_BASE_URL=https://your-backend-host
   VITE_APP_BASE_URL=https://your-frontend-host
   VITE_ENV=production
   ```
5. Validate connectivity by opening the Mini App inside Telegram; the client automatically calls `/api/verify-init` to ensure signatures match.

For a detailed walk-through (screenshots, manual QA), see `README-verify.md` and `DEPLOY.md`.

## Architecture (Backend layers)
- **domain/** — business entities (ORM models) grouped by bounded contexts (catalog, cart, orders, users, content).
- **application/** — use-cases/services per context (catalog, cart, orders, users) exposing DTOs and business logic.
- **infrastructure/** — repositories (SQLAlchemy) and external integrations; transport-agnostic.
- **transport/api/** — FastAPI routers that only map HTTP ↔ application layer and return Pydantic DTOs in the common envelope.

Example flow — GET /products/{id}:
1) transport/api → products router
2) application/catalog → product_service.get_product
3) infrastructure/repositories/catalog → ProductRepository.get_with_variants
4) domain/catalog → Product/ProductVariant mapped to ProductRead DTO
5) transport returns envelope `{ data, error, pagination }`

Example flow — PATCH /cart/{item_id}:
1) transport/api → cart router (validates CartItemUpdate)
2) application/cart → cart_service.update_item (business rules: stock, quantity)
3) infrastructure/repositories/cart → CartRepository (SQLAlchemy)
4) domain/cart → CartItem mapped to CartItemRead DTO
5) transport returns envelope with updated item
