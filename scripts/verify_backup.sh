#!/usr/bin/env bash
set -euo pipefail
PGURL="${PGURL:-postgresql://postgres:postgres@db:5432}"
TMP_DB="${TMP_DB:-brace_verify}"
LATEST=$(ls -1 backups/*.sql.gz 2>/dev/null | tail -1)
if [[ -z "${LATEST}" ]]; then
  echo "No backup files found in backups/" >&2
  exit 1
fi
echo "Using backup: ${LATEST}"
psql "${PGURL}" -c "DROP DATABASE IF EXISTS ${TMP_DB}" >/dev/null
psql "${PGURL}" -c "CREATE DATABASE ${TMP_DB}" >/dev/null
gzip -dc "${LATEST}" | psql "${PGURL}/${TMP_DB}" -v ON_ERROR_STOP=1
psql "${PGURL}/${TMP_DB}" -c "SELECT COUNT(*) AS orders_count FROM orders;"
psql "${PGURL}" -c "DROP DATABASE ${TMP_DB}" >/dev/null
echo "Backup verification succeeded"
