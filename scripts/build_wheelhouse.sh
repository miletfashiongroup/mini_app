#!/bin/sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WHEELHOUSE_DIR="${ROOT_DIR}/wheelhouse"
REQS_FILE="${ROOT_DIR}/wheelhouse-requirements.txt"

mkdir -p "${WHEELHOUSE_DIR}"
cd "${ROOT_DIR}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "python3 is required to build wheelhouse" >&2
  exit 1
fi

if ! "${PYTHON_BIN}" -m pip --version >/dev/null 2>&1; then
  echo "pip is required. Install python3-pip on the host first." >&2
  exit 1
fi

${PYTHON_BIN} - <<'PY' > "${REQS_FILE}"
import pathlib
import tomllib

lock_text = pathlib.Path("packages/backend/poetry.lock").read_text(encoding="utf-8")
data = tomllib.loads(lock_text)
reqs = []
for pkg in data.get("package", []):
    if "main" not in pkg.get("groups", []):
        continue
    line = f"{pkg['name']}=={pkg['version']}"
    markers = pkg.get("markers")
    if isinstance(markers, dict):
        markers = markers.get("main")
    if markers:
        line = f"{line}; {markers}"
    reqs.append(line)
print("\n".join(sorted(reqs)))
PY

PIP_INDEX_URL="${PIP_INDEX_URL:-https://pypi.org/simple}"
PIP_EXTRA_INDEX_URL="${PIP_EXTRA_INDEX_URL:-https://mirror.yandex.ru/pypi/simple}"
PIP_DEFAULT_TIMEOUT="${PIP_DEFAULT_TIMEOUT:-30}"
PIP_RETRIES="${PIP_RETRIES:-2}"

"${PYTHON_BIN}" -m pip download \
  --dest "${WHEELHOUSE_DIR}" \
  --prefer-binary \
  --index-url "${PIP_INDEX_URL}" \
  --extra-index-url "${PIP_EXTRA_INDEX_URL}" \
  --timeout "${PIP_DEFAULT_TIMEOUT}" \
  --retries "${PIP_RETRIES}" \
  -r "${REQS_FILE}"

echo "Wheelhouse ready: ${WHEELHOUSE_DIR}"
