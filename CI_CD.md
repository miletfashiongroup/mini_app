# Цикл разработки, CI/CD и деплой (BigTech-профиль)

Дата: 2026-02-09  
Принципы: GitHub — источник истины; CI — арбитр; Docker — единая среда; Staging — обязательный фильтр; Production — откатываемый.

## 1. Git-стратегия
- Ветки: `main` (prod), `feature/*`, `hotfix/*`.
- Прямые пуши в `main` запрещены (branch protection: запрет force-push, минимум 1 review, обязательный зелёный CI).
- Единственный путь в `main`: Pull Request + зелёный CI.

## 2. Локальная разработка
1) `git clone git@github.com:<org>/brace__1.git`  
2) `cp .env.example .env` (или `.env.staging` для стейджа).  
3) `docker compose --env-file .env -f infra/docker-compose.prod.yml up -d db redis`  
4) Backend: `make backend-install && poetry run alembic upgrade head && poetry run uvicorn brace_backend.main:app --reload`  
5) Frontend: `make frontend-install && pnpm dev -- --host`  
6) Перед PR: `pnpm -r lint && pnpm -r test && cd packages/backend && poetry run ruff check && poetry run pytest`.

## 3. CI (GitHub Actions)
- Файл: `.github/workflows/ci.yml`.
- Триггеры: pull_request, push в `main`.
- Проверки: pnpm lint/typecheck/tests, backend ruff + pytest (coverage gate), Playwright e2e, Docker build backend/frontend, OpenAPI drift check.
- Красный CI блокирует merge (branch protection).

## 4. Staging деплой
- Файл: `.github/workflows/staging.yml`.
- Триггеры: push в `main`, вручную (workflow_dispatch).
- Действия: buildx → пуш образов в GHCR (`ghcr.io/<org>/<repo>/backend:<sha>|staging`, `frontend:<sha>|staging`), SSH на staging, `git pull main`, экспорт `ENV_FILE=.env.staging` (fallback `.env`), `docker compose pull` + `up -d` для backend/admin-bot/scheduler/frontend.
- Требуемые секреты: `STAGING_HOST`, `STAGING_SSH_KEY`, `STAGING_PATH`. Репозиторий на сервере синхронизируется из GitHub (без копирования кода руками).

## 5. Production деплой
- Файл: `.github/workflows/prod.yml`.
- Триггеры: git tag `v*` или вручную.
- Этапы: buildx push образов в GHCR с тегом версии и `:prod`; на сервере — `git checkout <tag>`, экспорт `ENV_FILE=.env.production|.env`, **бэкап БД** (`docker compose run --rm backup sh /scripts/backup_db.sh`), затем Alembic `/opt/venv/bin/alembic upgrade head`, `docker compose pull` и `up -d`.  
- Секреты: `PROD_HOST`, `PROD_SSH_KEY`, `PROD_PATH`; среда `production` может быть защищена approval-ом в GitHub Environments.
- Деплой только из `main` через тег.

## 6. Миграции БД
- Правило: сначала staging, затем production.
- Staging: накатывается автоматически в рамках e2e/ручной проверки (при необходимости `docker compose run --rm backend /opt/venv/bin/alembic upgrade head` с `ENV_FILE=.env.staging`).  
- Production: выполняется шагом в `prod.yml` после бэкапа. Нет «тихих» миграций.

## 7. Rollback (3–5 минут)
- Точка восстановления: предыдущий prod-тег и последний успешный бэкап.
- Команды на сервере:
  - `git checkout <prev_tag>`  
  - `export BACKEND_IMAGE=ghcr.io/<org>/<repo>/backend:<prev_tag>` (аналогично для frontend/admin/scheduler)  
  - `docker compose --env-file $ENV_FILE -f infra/docker-compose.prod.yml pull backend admin-bot scheduler frontend`  
  - `docker compose --env-file $ENV_FILE -f infra/docker-compose.prod.yml up -d backend admin-bot scheduler frontend`
- Если миграция ломает схему: `docker compose --env-file $ENV_FILE -f infra/docker-compose.prod.yml run --rm backup pg_restore -d "$BACKUP_DATABASE_URL" < last.dump` (см. `BACKUP_RUNBOOK.md`).
- Решение об откате принимает дежурный/тимлид; фиксируется в постмортеме.

## 8. Чеклисты
### Перед PR
- [ ] Lint/Typecheck/Tests пройдены локально.
- [ ] OpenAPI/спеки не дрейфуют (`pnpm generate:api && git diff`).
- [ ] Нет секретов/DSN в диффе.

### Перед staging
- [ ] PR смёрджен в `main`; CI зелёный.
- [ ] `.env.staging` актуален (отдельная БД/Redis).
- [ ] Staging workflow завершился успешно; пройти авторизацию и 1–2 бизнес-сценария, проверить логи.

### Перед production
- [ ] Создан git tag `vX.Y.Z` от `main`.
- [ ] Staging OK, миграции проверены.
- [ ] Бэкап шагает успешно (смотрим лог prod workflow).
- [ ] Sentry/Netdata алерты включены.

### После production
- [ ] Smoke: `/api/health`, критичные пути в мини-аппе.
- [ ] Проверить метрики/логи на аномалии.
- [ ] Создать запись в CHANGELOG и отметить тег.

## 9. Запреты
- Никаких правок кода на серверах по SSH (только `docker compose` с образами из GHCR).
- Никаких пушей в `main` напрямую.
- Никаких миграций вручную мимо workflow.

## 10. Что настроить в GitHub (раздел Settings → Branch protection / Environments)
- `main`: запрет прямых пушей, обязательный статус `CI / build-and-test`, минимум 1 review, запрет на merge при красном CI.
- Environments: `staging`, `production` — при необходимости включить required reviewers для кнопочного развёртывания.

## 11. Кто за что отвечает
- Platform/DevOps: секреты в GitHub, доступы на staging/prod, Netdata/Sentry алерты, бэкапы.
- Backend: миграции, Alembic цепочка, smoke.
- Frontend: бандл бюджет, Sentry DSN, CSP соответствие.
- TL/On-call: решение об откате, контроль чеклистов.
