#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_BASE="${API_BASE:-http://localhost:8000}"
SMOKE_USER_ID="${SMOKE_USER_ID:-381202193}"

# Generate fresh tgWebAppData using the running backend container (uses BRACE_TELEGRAM_BOT_TOKEN from its env).
TG_DATA=$(cat <<PY | docker exec -i infra-backend-1 /opt/venv/bin/python -
import os, time, hmac, hashlib, urllib.parse, json

token = os.environ.get("BRACE_TELEGRAM_BOT_TOKEN")
if not token:
    raise SystemExit("BRACE_TELEGRAM_BOT_TOKEN is missing in backend container env")
secret_key = hmac.new(key=b"WebAppData", msg=token.encode(), digestmod=hashlib.sha256).digest()
user_id = int(os.environ.get("SMOKE_USER_ID", "381202193"))
user = {
    "id": user_id,
    "first_name": "smoke",
    "last_name": "tester",
    "username": "smoke_test",
    "language_code": "ru",
    "is_premium": True,
    "allows_write_to_pm": True,
}
auth_date = int(time.time())
fields = {
    "auth_date": auth_date,
    "query_id": "SMOKEQUERY",
    "user": user,
}
segments = []
for k in sorted(fields):
    v = fields[k]
    if isinstance(v, (dict, list)):
        v = json.dumps(v, separators=(",", ":"), ensure_ascii=False)
    segments.append(f"{k}={v}")
check_string = "\n".join(segments)
sig = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()
payload = {k: (json.dumps(v, separators=(",", ":"), ensure_ascii=False) if isinstance(v, (dict, list)) else v) for k, v in fields.items()}
payload["hash"] = sig
encoded = urllib.parse.urlencode(payload)
print(encoded)
PY
)

check() {
  local name="$1"; shift
  local path="$1"; shift
  local code
  code=$(curl -s -o /tmp/smoke_resp.json -w "%{http_code}" -H "X-Telegram-Init-Data: ${TG_DATA}" "${API_BASE}${path}")
  if [[ "${code}" -ge 500 ]]; then
    echo "[FAIL] ${name}: ${code}" && cat /tmp/smoke_resp.json && exit 1
  fi
  if [[ "${code}" -ge 400 ]]; then
    echo "[WARN] ${name}: ${code}" && cat /tmp/smoke_resp.json
  else
    echo "[OK] ${name}: ${code}"
  fi
}

check "banners" "/api/banners"
check "products" "/api/products?page_size=1"
check "me" "/api/users/me"

echo "Smoke check completed"
