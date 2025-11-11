# BRACE — Telegram Mini App Commerce Monorepo

BRACE is a production-ready monorepo for a Telegram Mini App that sells premium men's underwear. The repository bundles a FastAPI backend, a Vite + React frontend optimized for Telegram WebApp, infrastructure-as-code, CI/CD pipelines, and deployment playbooks so the project is deployable immediately.

## Tech Stack
- **Frontend**: Vite, React 18, TypeScript, TailwindCSS, TanStack Query, Zustand, Telegram WebApp SDK
- **Backend**: FastAPI, async SQLAlchemy (psycopg 3 async driver), PostgreSQL, Redis, Alembic, SlowAPI rate limiting
- **Infra**: Docker, docker-compose, nginx, GitHub Actions, Makefile helpers
- **Security**: Telegram initData HMAC validation, DOMPurify, rate limiting, strict CORS

## Repository Layout
```
packages/
  backend/        # FastAPI service + Alembic + tests + Dockerfile
  frontend/       # Vite React client + Tailwind + Dockerfile
infra/
  docker-compose.prod.yml
  nginx/app.conf
.github/workflows/ci.yml
README.md, README-verify.md, DEPLOY.md, CHANGELOG.md, POSTMORTEM.md
.env.example
```

## Key Features
- Telegram initData verification middleware and `/api/verify-init` probe
- Product, cart, order, and profile APIs with async PostgreSQL + Redis hooks
- 11 fully responsive Telegram-focused screens (home, catalog, product, size UX, profile, cart, etc.)
- Dockerized services (backend, frontend, PostgreSQL, Redis) runnable via one compose command
- GitHub Actions pipeline (lint → typecheck → test → build → deploy placeholder)
- Comprehensive documentation: quickstart, verification, deployment, change-log, postmortem templates

## Quickstart
1. Copy `.env.example` to `.env` and fill secrets (Telegram bot token, production URLs, DB creds).
2. Install toolchains:
   ```bash
   make backend-install frontend-install
   ```
3. Apply DB migrations & seed demo products:
   ```bash
   cd packages/backend
   poetry run alembic upgrade head
   poetry run python -m brace_backend.services.seed
   ```
4. Run services locally (replicates production topology):
   ```bash
   docker compose -f infra/docker-compose.prod.yml up --build
   ```
5. Open `http://localhost` for the Mini App shell and `http://localhost/api/health` for backend health.

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

## Security & Compliance
- initData is required on all protected routes via the `X-Telegram-Init-Data` header.
- FastAPI dependency verifies signature + freshness (5 minute TTL) via HMAC-SHA256.
- nginx only exposes port 80; backend stays inside Docker network.
- DOMPurify sanitizes dynamic text pages client-side.
- SlowAPI enforces `60/minute` rate limit per IP; adjust via `BRACE_RATE_LIMIT`.
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
