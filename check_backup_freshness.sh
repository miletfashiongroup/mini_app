#!/usr/bin/env bash
set -euo pipefail

# Checks that a recent backup exists and sends a Telegram alert if missing/stale.
# TELEGRAM_BACKUP_WEBHOOK should be a full Telegram Bot API URL, left as placeholder by default.

BACKUP_DIR="${BACKUP_DIR:-./backups}"
MAX_AGE_MINUTES="${MAX_BACKUP_AGE_MINUTES:-1500}" # 25h by default
WEBHOOK_URL="${TELEGRAM_BACKUP_WEBHOOK:-}"
PROJECT_NAME="${PROJECT_NAME:-brace}"

latest_backup="$(ls -1t "${BACKUP_DIR}/${PROJECT_NAME}"_*.dump 2>/dev/null | head -n1 || true)"

if [[ -z "${latest_backup}" ]]; then
  msg="Backup missing: no files in ${BACKUP_DIR}"
  echo "${msg}" >&2
  [[ -n "${WEBHOOK_URL}" ]] && curl -sS -X POST -H "Content-Type: application/json" -d "{\"text\":\"${msg}\"}" "${WEBHOOK_URL}" >/dev/null || true
  exit 1
fi

if [[ ! -s "${latest_backup}" ]]; then
  msg="Backup file is empty: ${latest_backup}"
  echo "${msg}" >&2
  [[ -n "${WEBHOOK_URL}" ]] && curl -sS -X POST -H "Content-Type: application/json" -d "{\"text\":\"${msg}\"}" "${WEBHOOK_URL}" >/dev/null || true
  exit 1
fi

file_ts=$(date -r "${latest_backup}" +%s)
now_ts=$(date +%s)
age_minutes=$(( (now_ts - file_ts) / 60 ))

if (( age_minutes > MAX_AGE_MINUTES )); then
  msg="Backup stale: ${latest_backup} age ${age_minutes}m > ${MAX_AGE_MINUTES}m"
  echo "${msg}" >&2
  [[ -n "${WEBHOOK_URL}" ]] && curl -sS -X POST -H "Content-Type: application/json" -d "{\"text\":\"${msg}\"}" "${WEBHOOK_URL}" >/dev/null || true
  exit 1
fi

echo "Backup OK: ${latest_backup} age ${age_minutes}m"
exit 0
