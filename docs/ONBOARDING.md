# Onboarding (Dev) — BRACE

Goal: любой разработчик за ≤30 минут поднимает окружение, коммитит через PR и не ломает prod.

## 1. Требования
- Docker Desktop/Engine + Compose v2
- Python 3.12, Poetry
- Node 20, pnpm
- pre-commit

## 2. Первый запуск
```bash
git clone git@github.com:brace/brace.git
cd brace
cp .env.example .env
make backend-install frontend-install
# инфраструктура для локала
docker compose -f infra/docker-compose.prod.yml up -d db redis
# миграции + сиды
cd packages/backend
poetry run alembic upgrade head
poetry run python -m brace_backend.services.seed
# запустить оба сервиса
cd ../..
make docker-up
```
Frontend: http://localhost, Backend: http://localhost:8000/api/health.

## 3. Ветки и PR
- feature: `feature/<task>`; hotfix: `hotfix/<issue>`
- PR обязательный, без прямых пушей в main.
- Перед пушем: `pre-commit install` однажды, затем `pre-commit run --all-files`.
- CI (как только включат секреты) — обязательный gate.

## 4. Качество
- Backend: `poetry run ruff check . && poetry run pytest --cov --cov-fail-under=70`.
- Frontend: `pnpm lint && pnpm test -- --coverage`.
- Smoke (read-only): `API_URL=https://bracefashion.online bash scripts/smoke_manual.sh`.

## 5. Секреты
- Никаких секретов в git. Использовать .env (локально) и GitHub Secrets (CI). Минимум: bot tokens, DB creds, Sentry, Metrika.

## 6. Деплой (когда CI включён)
- staging: merge в main или manual dispatch → docker-compose на staging.
- production: tag v* → бэкап БД → деплой образов → миграции.

## 7. Кого пинговать
- Tech Lead: @brace-techlead
- SRE/DevOps: @brace-sre
- Data/DBA: @brace-dba
