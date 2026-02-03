#!/usr/bin/env bash
set -euo pipefail

# Placeholder production deploy orchestrator.
# Usage: prod_backup_and_deploy.sh [precheck|deploy|alembic]

step="${1:-precheck}"

if [[ -z "${PROD_HOST:-}" || -z "${PROD_SSH_KEY:-}" || -z "${PROD_PATH:-}" ]]; then
  echo "Prod secrets not configured; skipping ${step}." >&2
  exit 0
fi

echo "Running ${step} on ${PROD_HOST}:${PROD_PATH} (placeholder)."
case "${step}" in
  precheck)
    echo "Insert backup freshness check or snapshot command once secrets are configured."
    ;;
  deploy)
    echo "Insert rsync/docker-compose deploy commands here."
    ;;
  alembic)
    echo "Insert alembic upgrade head via ssh here."
    ;;
  *)
    echo "Unknown step ${step}" >&2
    exit 1
    ;;
esac
