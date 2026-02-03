#!/bin/bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  set -- uvicorn brace_backend.main:app --host 0.0.0.0 --port 8000
fi

resolve_sync_dsn() {
  python - <<'PY'
import os
import sys
from brace_backend.core.config import settings
from brace_backend.core.database import ensure_sync_dsn

preferred = os.environ.get("ALEMBIC_DATABASE_URL")
fallback = os.environ.get("DATABASE_URL") or os.environ.get("BRACE_DATABASE_URL")
source = preferred or fallback or settings.database_url

if not source:
    print("Database URL is required via ALEMBIC_DATABASE_URL or DATABASE_URL", file=sys.stderr)
    raise SystemExit(1)

print(ensure_sync_dsn(source))
PY
}

if [ -z "${ALEMBIC_DATABASE_URL:-}" ]; then
  ALEMBIC_DATABASE_URL="$(resolve_sync_dsn)"
  export ALEMBIC_DATABASE_URL
fi

wait_for_database() {
  retries=${DB_CONNECT_MAX_RETRIES:-15}
  interval=${DB_CONNECT_RETRY_INTERVAL:-5}
  attempt=1

  while [ "$attempt" -le "$retries" ]; do
    if python - "$ALEMBIC_DATABASE_URL" <<'PY'
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

dsn = sys.argv[1]

try:
    engine = create_engine(dsn, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except SQLAlchemyError as exc:  # noqa: PERF203 - simple readiness probe
    print(f"connection-error:{exc}", file=sys.stderr)
    raise SystemExit(1)
else:
    raise SystemExit(0)
PY
    then
      echo "[entrypoint] Database is reachable."
      return 0
    fi

    if [ "$attempt" -eq "$retries" ]; then
      echo "[entrypoint] Database is unavailable after ${retries} attempts" >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    echo "[entrypoint] Database not ready, retrying in ${interval}s"
    sleep "$interval"
  done
}

wait_for_database

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
