# Development

## Quick start for new devs
- Clone: `git clone <repo> && cd tg_bot-main`
- Copy env: `cp .env.example .env` (fill Telegram token, DB creds, Sentry/Netdata placeholders).
- Install toolchains: `make backend-install frontend-install`.
- Run stack: `docker compose -f infra/docker-compose.prod.yml up -d db redis backend frontend`.
- Branching: create `feature/<ticket>`; open PR into `main` (no direct pushes; see `docs/BRANCH_PROTECTION.md`).
- CI: GitHub Actions `CI` runs lint/tests/build/docker; Lighthouse job is informational and allowed to fail.
- Telegram-бот при первом /start показывает юрдоки и спрашивает согласие; без согласия доступ не даётся (согласие хранится в users.consent_*).

## Helpful commands
- Backend dev server: `make backend-dev`
- Frontend dev: `cd packages/frontend && pnpm dev -- --host`
- Smoke tests: `make smoke` (uses `infra/docker-compose.prod.yml --profile smoke`)
- Scheduler logs: `docker compose -f infra/docker-compose.prod.yml logs -f scheduler`

## Observability locally
- Sentry DSN placeholder lives in `.env.example` (`BRACE_SENTRY_DSN`, `VITE_SENTRY_DSN`).
- Netdata (dev): `docker compose -f infra/docker-compose.observability.yml up -d netdata` then open `http://localhost:19999`.

## Backups
- Daily backup job runs in compose (`backup` service). Manual check: `./scripts/check_backup_freshness.sh`.
