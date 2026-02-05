# Security Policy

## Supported Versions
Production currently runs the code from the `main` branch (tagged releases). Only tagged images are deployable to production; untagged images are forbidden.

## Reporting a Vulnerability
- Internal team: create a private ticket in Jira project SEC with severity and reproduction. Notify @oncall-backend and @oncall-frontend in Slack #sec.
- External: email security@bracefashion.online. We acknowledge within 24h and target fix within 72h for high/critical issues.

## Secrets Management
- Secrets **never** live in git. Populate via environment/CI secrets only. See `.env.example` for required keys. Rotate tokens (Telegram, Yandex Metrica, Sentry, DB) every 90 days or after incident.
- Access to prod secrets is restricted to SRE + Tech Lead; staging secrets to engineering. Store SSH keys in 1Password; forbid sharing via chat.
- Bots: tokens set through environment variables `BRACE_ADMIN_BOT_TOKEN`, `BRACE_SUPPORT_BOT_TOKEN`. Revoke via BotFather on compromise.

## Data Classification & PII
- PII: Telegram user id, username, first/last name, phone, address; order contents. Classified as **Confidential**.
- Storage: PostgreSQL (encrypted at-rest by disk), PII encryption key `BRACE_PII_ENCRYPTION_KEY` for sensitive fields; Redis holds sessionless rate-limit counters only.
- Retention: delete user profile + orders upon GDPR/152‑FZ request; logs are kept 30 days.

## Application Hardening
- Telegram initData HMAC validation enforced on all authenticated routes.
- CORS restricted to `https://bracefashion.online` and `https://www.bracefashion.online` in production (configure via `BRACE_CORS_ORIGINS`).
- Rate limiting: SlowAPI 60/min per IP (adjust `BRACE_RATE_LIMIT`).
- Content Security Policy is enforced by Telegram WebView; inline scripts are blocked. Custom Metrika loader keeps CSP compliance.
- Admin/support bots run with least-privilege tokens; forum topic IDs are validated before calls.

## Infrastructure Hardening
- Deployments happen via Docker images only; no ad‑hoc SSH changes to containers. Backend and frontend run as non-root users inside images.
- Postgres and Redis are internal-only within Docker network; nginx is the only public entry.
- Backups: nightly logical dump in `backups/`; verify freshness with `./check_backup_freshness.sh` before releases. Use `RUNBOOK_ROLLBACK.md` for restore.

## Logging & Monitoring
- Error traces are sent to Sentry when `BRACE_SENTRY_DSN` is set.
- Prometheus metrics exposed at `/metrics`; add alerting for 5xx rate spikes, latency, and bot callback failures (`admin_bot_status_failed`).
- Health endpoints: `/api/health`; container socket health checks for bots/scheduler (see `infra/docker-compose.prod.yml`).

## Third‑Party Dependencies
- Lock files: `pyproject.toml`/`pnpm-lock.yaml`. Update monthly; run `poetry update --sync` and `pnpm up --latest --interactive` on a branch.
- Scan for vulnerabilities with `poetry export | pip-audit` and `pnpm audit --prod` (documented in `docs/CI-CD.md`).

## Incident Response
- Follow `POSTMORTEM.md` template after every Sev1/Sev2.
- Immediate actions: enable maintenance in nginx, revoke leaked tokens, rotate DB credentials, restore from latest verified backup if data is corrupted.
