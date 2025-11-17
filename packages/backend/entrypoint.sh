#!/bin/sh
set -euo pipefail

if [ "$#" -eq 0 ]; then
  set -- uvicorn brace_backend.main:app --host 0.0.0.0 --port 8000
fi

if [ -z "${ALEMBIC_DATABASE_URL:-}" ]; then
  echo "ALEMBIC_DATABASE_URL environment variable is required" >&2
  exit 1
fi

MAX_RETRIES=${ALEMBIC_MAX_RETRIES:-10}
RETRY_INTERVAL=${ALEMBIC_RETRY_INTERVAL:-3}

attempt=1
while true; do
  echo "[entrypoint] Running database migrations (attempt ${attempt}/${MAX_RETRIES})"
  if python -m alembic upgrade head; then
    break
  fi

  if [ "$attempt" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] Failed to apply migrations after ${MAX_RETRIES} attempts" >&2
    exit 1
  fi

  attempt=$((attempt + 1))
  echo "[entrypoint] Migration failed, retrying in ${RETRY_INTERVAL}s"
  sleep "$RETRY_INTERVAL"
done

echo "[entrypoint] Seeding database (if required)"
python -m brace_backend.db.seed

echo "[entrypoint] Starting application: $*"
exec "$@"
