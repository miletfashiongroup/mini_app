#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_SOURCE="$ROOT_DIR/../../infra/nginx/app.conf"
CONFIG_DEST="$ROOT_DIR/nginx.conf"

cleanup() {
  rm -f "$CONFIG_DEST"
}

trap cleanup EXIT

if [ ! -f "$CONFIG_SOURCE" ]; then
  echo "[render-build] Missing nginx config: $CONFIG_SOURCE" >&2
  exit 1
fi

echo "[render-build] Copying nginx config into build context"
cp "$CONFIG_SOURCE" "$CONFIG_DEST"

pushd "$ROOT_DIR" >/dev/null
echo "[render-build] Installing frontend dependencies"
npm install --no-audit --progress=false
echo "[render-build] Building frontend bundle"
npm run build
popd >/dev/null

if [ "$#" -gt 0 ]; then
  echo "[render-build] Running post-build command: $*"
  "$@"
fi

echo "[render-build] Build script completed"
