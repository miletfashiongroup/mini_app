#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WHEELHOUSE_DIR="${ROOT_DIR}/wheelhouse"

mkdir -p "${WHEELHOUSE_DIR}"

docker run --rm \
  -e PIP_INDEX_URL="${PIP_INDEX_URL:-https://pypi.org/simple}" \
  -e PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL:-https://mirror.yandex.ru/pypi/simple}" \
  -v "${ROOT_DIR}:/src:ro" \
  -v "${WHEELHOUSE_DIR}:/wheels" \
  python:3.12-slim-bookworm \
  /bin/sh -c "
    set -euo pipefail
    python - <<'PY'
import pathlib
import tomllib

lock_text = pathlib.Path('/src/packages/backend/poetry.lock').read_text(encoding='utf-8')
data = tomllib.loads(lock_text)
reqs = []
for pkg in data.get('package', []):
    if 'main' not in pkg.get('groups', []):
        continue
    line = f\"{pkg['name']}=={pkg['version']}\"
    markers = pkg.get('markers')
    if isinstance(markers, dict):
        markers = markers.get('main')
    if markers:
        line = f\"{line}; {markers}\"
    reqs.append(line)
pathlib.Path('/tmp/requirements.txt').write_text('\\n'.join(sorted(reqs)) + '\\n', encoding='utf-8')
PY
    python -m pip download --dest /wheels --prefer-binary -r /tmp/requirements.txt
  "

echo "Wheelhouse ready: ${WHEELHOUSE_DIR}"
