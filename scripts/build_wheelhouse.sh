#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-/root/brace__1}"
WHEEL_DIR="$ROOT_DIR/wheelhouse"
VENV_DIR="/root/.venvs/brace_wheelhouse"
REQ_FILE="$ROOT_DIR/packages/backend/requirements.txt"

mkdir -p "$WHEEL_DIR"

python3 - <<'PY'
import pathlib
import tomllib
root = pathlib.Path('/root/brace__1')
lock_text = (root / 'packages/backend/poetry.lock').read_text(encoding='utf-8')
data = tomllib.loads(lock_text)
reqs = []
for pkg in data.get('package', []):
    if 'main' not in pkg.get('groups', []):
        continue
    line = f"{pkg['name']}=={pkg['version']}"
    markers = pkg.get('markers')
    if isinstance(markers, dict):
        markers = markers.get('main')
    if markers:
        line = f"{line}; {markers}"
    reqs.append(line)
(root / 'packages/backend/requirements.txt').write_text('\n'.join(sorted(reqs)) + '\n', encoding='utf-8')
PY

python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip setuptools wheel >/dev/null

PIP_INDEX_URL="${PIP_INDEX_URL:-https://mirror.yandex.ru/pypi/simple}" \
PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL:-https://pypi.org/simple}" \
"$VENV_DIR/bin/pip" download --dest "$WHEEL_DIR" --prefer-binary -r "$REQ_FILE"

"$VENV_DIR/bin/pip" check >/dev/null || true

echo "wheelhouse_ready"
