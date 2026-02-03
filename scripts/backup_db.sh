#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
DB_URL="${BACKUP_DATABASE_URL:-${BRACE_DATABASE_URL:-${ALEMBIC_DATABASE_URL:-}}}"

if [[ -z "$DB_URL" ]]; then
  echo "BACKUP_DATABASE_URL or BRACE_DATABASE_URL is required" >&2
  exit 1
fi

if [[ "$DB_URL" == postgresql+* ]]; then
  DB_URL="postgresql://${DB_URL#*://}"
fi
if [[ "$DB_URL" == postgres+* ]]; then
  DB_URL="postgresql://${DB_URL#*://}"
fi

mkdir -p "$BACKUP_DIR"
ts="$(date -u +%Y%m%d_%H%M%S)"
file="${BACKUP_DIR}/brace_${ts}.dump"

if pg_dump --format=custom --no-owner --no-acl --file "$file" "$DB_URL"; then
  echo "BACKUP SUCCESS: $file"
  find "$BACKUP_DIR" -type f -name "brace_*.dump" -mtime +"$RETENTION_DAYS" -delete
  exit 0
else
  echo "BACKUP FAILED: $file" >&2
  exit 1
fi
