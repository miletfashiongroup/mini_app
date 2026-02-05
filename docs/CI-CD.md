# CI/CD & Release Process

## Branching
- `main` = production. Protected: только через PR, CI обязателен, прямые пуши запрещены.
- `feature/*` для фич, `hotfix/*` для срочных фиксов.
- Правило: PR → CI green → review → merge.

## CI (GitHub Actions)
- `.github/workflows/ci.yml`: backend pytest, frontend build, docker build, gitleaks + trivy fs.
- При наличии доступа включить branch protection main, чтобы красный CI блокировал merge.

## Staging
- `.github/workflows/deploy-staging.yml`: триггер push main или manual dispatch.
- Требует секретов: STAGING_DEPLOY_ENABLED=true, STAGING_HOST, STAGING_SSH_USER, STAGING_SSH_KEY.
- Действия: ssh на staging → git fetch/reset origin/main → `docker compose -f infra/docker-compose.prod.yml up -d --build backend frontend admin-bot support-bot scheduler`.
- Миграции: сначала staging: `docker compose -f infra/docker-compose.prod.yml run --rm backend alembic upgrade head`.

## Production
- `.github/workflows/prod.yml`: запускается по тегу `v*` (release только из main) или вручную.
- Требует PROD_HOST, PROD_SSH_USER, PROD_SSH_KEY, PROD_PATH.
- Шаги после настройки: backup БД → deploy нужного тега → alembic upgrade → health-check.
- Rollback: задеплоить предыдущий тег (pull нужного образа и `up -d`); при schema-breaker — восстановить БД из backup.

## Checklists
### Перед staging
- CI green
- Миграции просмотрены
- `.env.example` обновлён при добавлении переменных

### Перед production
- Тег создан от main
- Staging проверен (заказ, смена статуса, поддержка)
- Backup выполнен

### После production
- Смоук критических сценариев
- 30 минут мониторинг логов/алертов

## Локальная разработка
- `git clone ...`
- `cp .env.example .env` и заполнить секреты
- `docker compose -f infra/docker-compose.prod.yml up backend frontend` (или dev-compose)

## Rollback (коротко)
- Выбрать предыдущий релизный тег.
- Запустить prod workflow с этим тегом (или вручную: ssh, pull образ тега, docker compose up -d).
- При несовместимых миграциях: восстановить БД из backup, взятого перед релизом.
