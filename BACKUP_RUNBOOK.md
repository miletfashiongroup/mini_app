# Backup & Restore Runbook (Postgres)

## What is backed up
- Primary Postgres database used by the backend.
- Backups are taken daily by the `backup` service in `infra/docker-compose.prod.yml`.

## Where backups live
- Host directory: `./backups`
- Files: `brace_YYYYMMDD_HHMMSS.dump`
- Retention: 14 days (configurable via `BACKUP_RETENTION_DAYS`); verify freshness with `./scripts/check_backup_freshness.sh` (sends Telegram alert if `TELEGRAM_BACKUP_WEBHOOK` is set).

## How to run a backup manually
```bash
BACKUP_DATABASE_URL="postgresql://user:pass@host:5432/brace" \
BACKUP_DIR="./backups" \
BACKUP_RETENTION_DAYS=14 \
./scripts/backup_db.sh
```

## How to restore
1) Identify the backup file in `./backups`.
2) Set `RESTORE_CONFIRM=YES` to avoid accidental restores.
3) Run:
```bash
RESTORE_CONFIRM=YES \
BACKUP_DATABASE_URL="postgresql://user:pass@host:5432/brace" \
./scripts/restore_db.sh ./backups/brace_YYYYMMDD_HHMMSS.dump
```

## Expected restore time
- Small DBs: minutes
- Larger DBs: tens of minutes (depends on disk and CPU)

## Notes
- Do not commit backup files. They are ignored by `.gitignore`.
- Use the same Postgres major version as production for restore.
