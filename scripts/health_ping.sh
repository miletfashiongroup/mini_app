#!/usr/bin/env bash
set -euo pipefail

# Lightweight health ping with Telegram notification placeholder.

HEALTH_URL="${HEALTH_URL:-http://backend:8000/api/health}"
WEBHOOK_URL="${TELEGRAM_HEALTH_WEBHOOK:-}"
PROJECT_NAME="${PROJECT_NAME:-brace}"

response="$(curl -fsS --max-time 5 "${HEALTH_URL}" 2>&1 || true)"
status=$?

if [[ ${status} -ne 0 ]]; then
  msg="Health check FAILED for ${PROJECT_NAME}: ${HEALTH_URL} (${response})"
  echo "${msg}" >&2
  [[ -n "${WEBHOOK_URL}" ]] && curl -sS -X POST -H "Content-Type: application/json" -d "{\"text\":\"${msg}\"}" "${WEBHOOK_URL}" >/dev/null || true
  exit 1
fi

echo "Health check OK for ${PROJECT_NAME}"
exit 0
