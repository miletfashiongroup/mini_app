# Security Checklist (Release Gate)

## Pre-PR
- `pre-commit run --all-files` (ruff/black/gitleaks).
- No secrets in diff; verify with `gitleaks detect --source .`.

## Pre-merge (CI when enabled)
- Dependency scan: `pip-audit -r <(poetry export -f requirements.txt)`; `pnpm audit --prod`.
- Container scan: `trivy fs .` and `trivy image backend:latest` (staging images).
- Lint/typecheck/tests/coverage thresholds met.

## Pre-release (staging → prod)
- Sentry DSN set, log level INFO, JSON logs enabled.
- CORS restricted to production domains.
- DB backup verified fresh (<26h) and restore-tested to temp DB.
- Secrets rotated if older than 90 days (Telegram bots, DB, Metrika token, Sentry).
- Webhook tokens/InitData TTL validated in staging.

## Production deploy
- Deploy only tagged images; record image digest.
- Run smoke (`scripts/smoke_manual.sh`) against prod endpoints post-deploy.
- Enable alerting (5xx >1%, P95 latency, bot callback errors, backup freshness).

## Incident response
- On leak: revoke BotFather tokens, rotate DB creds, invalidate sessions; switch to maintenance page.
- File POSTMORTEM within 24h; update SECURITY.md and runbooks with lessons.

