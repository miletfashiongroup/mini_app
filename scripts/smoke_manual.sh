#!/usr/bin/env bash
# Simple manual smoke. Safe for staging/local (no writes except optional analytics event).
# Usage: API_URL=http://localhost:8000 bash scripts/smoke_manual.sh
set -euo pipefail
API_URL=${API_URL:-http://localhost:8000}

fail() { echo "[FAIL] $1"; exit 1; }
pass() { echo "[OK]   $1"; }

curl_json() {
  local method="$1"; shift
  local path="$1"; shift
  local data="${1:-}"
  local out=/tmp/smoke.out
  if [ "$method" = GET ]; then
    code=$(curl -s -o "$out" -w "%{http_code}" "$API_URL$path")
  else
    code=$(curl -s -o "$out" -w "%{http_code}" -H Content-Type: application/json -X "$method" -d "$data" "$API_URL$path")
  fi
  echo "-- $method $path => $code" && cat "$out" && echo
  echo "$code"
}

# 1) Health
code=$(curl_json GET /api/health)
[ "$code" = "200" ] || fail "health"
pass "health"

# 2) Catalog (read-only)
code=$(curl_json GET "/api/products?limit=1")
[ "$code" = "200" ] || echo "[WARN] products endpoint not 200 (maybe auth)"

# 3) Analytics ingest (safe: app_open, no PII)
now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
payload=$(cat <<JSON
{"schema_version":1,"session_id":"smoke-session","device_id":"smoke-device","anon_id":"smoke-anon","context":{},"events":[{"event_id":"00000000-0000-0000-0000-000000000001","name":"app_open","occurred_at":"$now","version":1,"properties":{"first_open":false},"screen":"/"}]}
JSON
)
code=$(curl_json POST /api/analytics/events "$payload")
[ "$code" = "200" ] || echo "[WARN] analytics ingest not 200"

# 4) Metrics (best-effort)
code=$(curl_json GET /metrics)
[ "$code" = "200" ] || echo "[WARN] metrics not 200"

pass "smoke complete"
