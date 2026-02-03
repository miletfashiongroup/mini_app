# Rollback / Restore Runbook

## When to use
- Failed deploy, Alembic migration issue, or bad config leading to 5xx/alerts.

## Preparation
- Ensure latest backup present (`./scripts/check_backup_freshness.sh`).
- Keep `infra/docker-compose.prod.yml.bak` and `/etc/docker/daemon.json.bak` handy for rollback.

## Rapid rollback (app only)
1. Re-deploy previous release artifacts (tagged image or prior release dir).
2. `docker compose -f infra/docker-compose.prod.yml up -d backend frontend admin-bot scheduler`.
3. Verify `GET /api/health` returns 200 and frontend loads.

## Database restore test (non-disruptive)
1. Pick latest dump from `./backups/brace_YYYYMMDD_HHMMSS.dump`.
2. Launch temp DB container:
   ```bash
   docker run --rm -d --name brace-restore-test -e POSTGRES_PASSWORD=postgres -p 55432:5432 postgres:17-alpine
   ```
3. Restore:
   ```bash
   pg_restore -h localhost -p 55432 -U postgres -d postgres ./backups/<dumpfile>
   psql -h localhost -p 55432 -U postgres -c "select 1;"
   ```
4. Drop temp container: `docker rm -f brace-restore-test`.
5. Record result (pass/fail, dump name, timestamp).

### Latest tested restore
- Date: 2026-02-03
- Dump: `brace_tg_20260203045206.dump`
- Steps: temp postgres:17-alpine on :15432, created role `brace_user`, `pg_restore --clean --if-exists --no-owner` into temp DB, `select count(*) from alembic_version` returned `1`.

## Full DB rollback (production)
1. Confirm bad deployment window and target backup file.
2. Stop writers: `docker compose -f infra/docker-compose.prod.yml stop backend admin-bot scheduler`.
3. Restore chosen dump to production DB container (ensure matching Postgres major version):
   ```bash
   RESTORE_CONFIRM=YES ./scripts/restore_db.sh ./backups/<dumpfile>
   ```
4. Start services: `docker compose -f infra/docker-compose.prod.yml up -d backend admin-bot scheduler`.
5. Validate `GET /api/health`, run smoke: `docker compose -f infra/docker-compose.prod.yml --profile smoke up --build smoke-tests`.
6. Post-mortem + root cause before re-deploying.

## Network / auth rollback
- If pg_hba edits break auth, restore `/var/lib/postgresql/data/pg_hba.conf.bak` (or container-specific path) and restart Postgres container.
- If Docker daemon restart failed, restore `/etc/docker/daemon.json.bak` then `systemctl restart docker`.
