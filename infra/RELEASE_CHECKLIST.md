# Release Checklist

- [ ] Branch: releasing from `main` merge commit; tag format `vYYYY.MM.DD` or `vX.Y.Z`.
- [ ] CI green (CI + optional Lighthouse).
- [ ] Backups: latest `./backups/brace_*.dump` < 24h old (`./scripts/check_backup_freshness.sh` or Netdata alarm).
- [ ] Secrets: rotation plan quarterly (set reminder); confirm `.env` placeholders replaced in target envs; no secrets committed.
- [ ] DB migrations: Alembic head matches repo (`alembic current` shows head).
- [ ] Observability: Sentry DSN configured per env, Netdata Telegram webhook configured, health-ping webhook set; Sentry reachable at `http://<host>:9000` (`/_health/`).
- [ ] Deploy strategy: stage first (staging.yml), then prod tag; ensure rollback steps in `RUNBOOK_ROLLBACK.md` are ready.
- [ ] Branch protection in GitHub settings active (no direct pushes to `main`; PR + review required).
