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
   Populate `BRACE_TELEGRAM_BOT_TOKEN`, database credentials, and the `VITE_*` URLs that the frontend will embed.
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
   npm run dev -- --host
   ```
   Visit `http://localhost:4173`; Vite proxies API calls to the backend URL from `.env`.
6. **Full stack via Docker Compose**
   ```bash
   make docker-up          # build + run backend, frontend, postgres, redis
   make docker-logs        # follow backend/frontend logs
   make docker-down        # stop stack and wipe volumes
   ```
   Frontend is served at `http://localhost`, backend at `http://localhost:8000`.
7. **Smoke tests / CI validation**
   ```bash
   make smoke
   # or directly:
   docker compose -f infra/docker-compose.prod.yml --profile smoke up --build smoke-tests
   ```
   The smoke runner resets PostgreSQL, seeds fixtures, hits all public APIs, checks the frontend, and exits non‑zero on any failure.

## Environment Variables
`.env.example` contains sane defaults; override sensitive values per environment.

| Variable | Purpose | Default |
| --- | --- | --- |
| `BRACE_DATABASE_URL` | Async SQLAlchemy DSN for the app | `postgresql+psycopg_async://postgres:postgres@db:5432/brace` |
| `ALEMBIC_DATABASE_URL` | Sync DSN used by Alembic/entrypoint migrations | `postgresql+psycopg://postgres:postgres@db:5432/brace` |
| `BRACE_REDIS_URL` | SlowAPI limiter storage | `memory://` locally, overridden to `redis://redis:6379/0` inside Docker |
| `BRACE_TELEGRAM_BOT_TOKEN` | Required for initData validation | _(set per BotFather)_ |
| `BRACE_CORS_ORIGINS` | Allowed origins array | `["http://localhost","http://localhost:4173"]` |
| `VITE_BACKEND_URL` | API base URL compiled into the frontend bundle | `http://localhost:8000` |
| `VITE_APP_URL` | Public frontend URL for Telegram `/setdomain` | `http://localhost` |
| `POSTGRES_USER/PASSWORD/DB` | Docker Compose Postgres bootstrap | `postgres / postgres / brace` |

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
- **Backend unit/integration**: `make backend-test` (requires PostgreSQL reachable at `postgresql://postgres:postgres@localhost:5432/brace_test`; run `docker compose -f infra/docker-compose.prod.yml up -d db redis` beforehand).
- **Frontend lint/unit**: `cd packages/frontend && npm run lint && npm run test`.
- **Smoke/e2e**: `make smoke` (wraps `infra/docker-compose.smoke.yml`) or `docker compose -f infra/docker-compose.prod.yml --profile smoke up --abort-on-container-exit smoke-tests`.

## Security & Compliance
- initData is required on all protected routes via the `X-Telegram-Init-Data` header.
- FastAPI dependency verifies signature + freshness (5 minute TTL) via HMAC-SHA256.
- nginx only exposes port 80; backend stays inside Docker network.
- DOMPurify sanitizes dynamic text pages client-side.
- SlowAPI enforces `60/minute` rate limit per IP; adjust via `BRACE_RATE_LIMIT`.
- Rate-limit counters are kept in Redis (Compose) with an automatic in-memory fallback for local development.
- No secrets are committed; all sensitive data lives in `.env` or CI secrets.

## CI/CD Overview
GitHub Actions pipeline (`.github/workflows/ci.yml`):
1. **lint** — Ruff for backend, ESLint for frontend
2. **typecheck** — mypy-ready toolchain & TypeScript
3. **test** — pytest (backend) and React Testing Library placeholders (extend as needed)
4. **build** — Docker build for backend & frontend images
5. **deploy** — shell stage ready for integration with Render/Railway (uses protected secret gates)

## Telegram Mini App Integration
1. Create a bot via [@BotFather](https://t.me/BotFather) and capture `BOT_TOKEN`.
2. Generate a WebApp via `/setdomain` and `/newapp`, pointing to the deployed frontend URL (`FRONTEND_URL`).
3. Configure the backend URL (`BACKEND_URL`) as the Mini App’s data source for API calls.
4. Populate `.env`:
   ```env
   BRACE_TELEGRAM_BOT_TOKEN=<BOT_TOKEN>
   BRACE_CORS_ORIGINS=["https://your-frontend-host", "http://localhost"]
   VITE_BACKEND_URL=https://your-backend-host
   VITE_APP_URL=https://your-frontend-host
   ```
5. Validate connectivity by opening the Mini App inside Telegram; the client automatically calls `/api/verify-init` to ensure signatures match.

For a detailed walk-through (screenshots, manual QA), see `README-verify.md` and `DEPLOY.md`.
