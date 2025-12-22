
ARG PYTHON_VERSION=3.12-slim-bookworm
ARG PIP_INDEX_URL=https://pypi.org/simple
ARG PIP_EXTRA_INDEX_URL=https://mirror.yandex.ru/pypi/simple
ARG PIP_TRUSTED_HOST=mirror.yandex.ru
ARG PIP_OFFLINE=0
ARG WHEELHOUSE_URL=

FROM python:${PYTHON_VERSION} AS deps
ARG PIP_INDEX_URL
ARG PIP_EXTRA_INDEX_URL
ARG PIP_OFFLINE
ARG PIP_TRUSTED_HOST
ARG WHEELHOUSE_URL
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_RETRIES=5 \
    PIP_INDEX_URL=${PIP_INDEX_URL} \
    PIP_EXTRA_INDEX_URL=${PIP_EXTRA_INDEX_URL} \
    PIP_CACHE_DIR=/root/.cache/pip \
    PIP_FIND_LINKS=/wheels \
    PIP_PREFER_BINARY=1 \
    PIP_TRUSTED_HOST=${PIP_TRUSTED_HOST}
WORKDIR /app
COPY wheelhouse /wheels

RUN if [ -n "$WHEELHOUSE_URL" ]; then \
      echo "Downloading wheelhouse from $WHEELHOUSE_URL"; \
      mkdir -p /wheels; \
      curl -fL "$WHEELHOUSE_URL" | tar -xz -C /wheels; \
    fi

# More resilient apt: switch to a reachable mirror and retry updates
RUN set -eux; \
    rm -f /etc/apt/sources.list.d/debian.sources; \
    printf 'Acquire::Retries "5";\nAcquire::http::Timeout "20";\nAcquire::https::Timeout "20";\n' > /etc/apt/apt.conf.d/99retries; \
    echo "deb http://mirror.yandex.ru/debian bookworm main contrib non-free" > /etc/apt/sources.list; \
    echo "deb http://mirror.yandex.ru/debian bookworm-updates main contrib non-free" >> /etc/apt/sources.list; \
    echo "deb http://mirror.yandex.ru/debian-security bookworm-security main contrib non-free" >> /etc/apt/sources.list; \
    for i in 1 2 3 4 5; do \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        build-essential \
        curl \
      && break || { echo "apt failed on attempt $i, retrying..."; sleep 5; }; \
    done; \
    rm -rf /var/lib/apt/lists/*

COPY packages/backend/pyproject.toml packages/backend/poetry.lock* ./ 
RUN python - <<'PY'
import pathlib
import tomllib

lock_text = pathlib.Path("poetry.lock").read_text(encoding="utf-8")
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
pathlib.Path("requirements.txt").write_text("\n".join(sorted(reqs)) + "\n", encoding="utf-8")
PY
RUN python -m venv /opt/venv \
 && if [ "$PIP_OFFLINE" = "1" ]; then \
      if [ -z "$(ls -A /wheels 2>/dev/null)" ]; then \
        echo "wheelhouse is empty; build it on a machine with internet or set PIP_OFFLINE=0" >&2; \
        exit 2; \
      fi; \
      /opt/venv/bin/pip install --no-index --find-links=/wheels --prefer-binary -r requirements.txt; \
    else \
      /opt/venv/bin/pip download --dest /wheels --prefer-binary -r requirements.txt; \
      /opt/venv/bin/pip install --no-index --find-links=/wheels --prefer-binary -r requirements.txt; \
    fi

FROM python:${PYTHON_VERSION} AS runtime
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/src \
    PATH="/opt/venv/bin:$PATH"
WORKDIR /app

COPY --from=deps /opt/venv /opt/venv
COPY packages/backend/src ./src
COPY packages/backend/alembic ./alembic
COPY packages/backend/alembic.ini .
COPY packages/backend/entrypoint.sh .
RUN chmod +x /app/entrypoint.sh

FROM runtime AS smoke-runner
COPY packages/backend/tests ./tests
ENTRYPOINT []

FROM runtime AS app
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["uvicorn", "brace_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
