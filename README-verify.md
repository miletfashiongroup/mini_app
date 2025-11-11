# BRACE Verification Guide

Step-by-step checklist for validating the monorepo on Windows, WSL, or Linux.

## 1. Prerequisites
- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Python 3.12+
- Node.js 20+
- Poetry 1.8.x (`pipx install poetry==1.8.3`)
- npm 10+

## 2. Environment Setup
```bash
cp .env.example .env
# edit .env with your secrets (Telegram token, DB passwords, URLs)
```

## 3. Backend
```bash
cd packages/backend
poetry install --no-root
poetry run alembic upgrade head
poetry run python -m brace_backend.services.seed
poetry run pytest
poetry run uvicorn brace_backend.main:app --reload
```
Check `http://localhost:8000/api/health`.

## 4. Frontend
```bash
cd packages/frontend
npm install
npm run lint
npm run typecheck
npm run dev -- --host
```
Open `http://localhost:4173`.

## 5. End-to-End via Docker
```bash
docker compose -f infra/docker-compose.prod.yml up --build
```
- Frontend: `http://localhost`
- Backend: `http://localhost/api/health`

## 6. Telegram Mini App Smoke Test
1. In `.env`, ensure `VITE_BACKEND_URL` and `VITE_APP_URL` resolve from Telegram.
2. Build frontend: `cd packages/frontend && npm run build`.
3. Deploy following `DEPLOY.md` (Render + Vercel example).
4. In @BotFather:
   - `/setdomain` → `<FRONTEND_URL>`
   - `/newapp` → choose the bot, set platform = `webapp`, start parameter = `brace`
   - `/setmenubutton` → web_app pointing to `<FRONTEND_URL>`
5. Open the bot, tap “Open Mini App”.
6. Inspect browser devtools → Network → confirm `/api/verify-init` returns `{ status: 'verified' }`.

## 7. Teardown
```bash
docker compose -f infra/docker-compose.prod.yml down -v
```
