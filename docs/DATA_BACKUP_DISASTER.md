# Data, Migrations & Disaster Recovery

## Classification
- PII: Telegram user id/username/name/phone/address; Order contents. Confidential.

## Backups
- Schedule: nightly logical dump via `backups/` (cron on host). Retention: 14 days daily, 3 months weekly.
- Location: `/root/brace__1/releases/backups` (encrypted volume; access SRE+DBA).
- Freshness check: `./check_backup_freshness.sh` (fails if >26h). Run before every prod deploy.

## Verification (must do before prod deploy)
```bash
# example
export PGURL=postgresql://postgres:postgres@db:5432
LATEST=$(ls -1 backups/*.sql.gz | tail -1)
gzip -dc "$LATEST" | psql "$PGURL/brace_verify" -v ON_ERROR_STOP=1
psql "$PGURL/brace_verify" -c "SELECT COUNT(*) FROM orders;"
# drop temp
psql "$PGURL" -c "DROP DATABASE brace_verify;"
```
Automate this in CI/CD (pre-prod job) once secrets available.

## Migrations
- Tool: Alembic (packages/backend/alembic).
- Rule: migrate staging first, then prod. No in-place schema edits on prod.
- Workflow: `poetry run alembic revision --autogenerate -m "..."` → review diff → `upgrade head` on staging → verify → prod deploy applies migrations with backup.
- Rollback: prefer forward fixes; in emergencies `alembic downgrade -1` only after lead approval.

## Restore Runbook (summary)
1) Stop traffic (nginx maintenance or disable bots).
2) Identify snapshot (latest verified) from `backups/`.
3) Restore to new DB instance: `psql -f dump.sql` into fresh database.
4) Point backend `.env` `BRACE_DATABASE_URL` to restored DB or swap via DNS/connection string.
5) Run smoke + critical flows; re-enable traffic.
6) File postmortem (POSTMORTEM.md).

## RPO/RTO
- RPO: ≤24h (nightly). Consider WAL-based PITR if tighter needed.
- RTO: ≤30m with verified dump; target ≤10m with automated restore to standby.

