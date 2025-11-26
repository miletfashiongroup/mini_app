
ARG PYTHON_VERSION=3.12-slim

FROM python:${PYTHON_VERSION} AS deps
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DEFAULT_TIMEOUT=240 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_RETRIES=5 \
    POETRY_VERSION=1.8.3 
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential curl \
 && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://install.python-poetry.org | python3 -
# FIX poetry
ENV PATH="/root/.local/bin:$PATH" 

COPY packages/backend/pyproject.toml packages/backend/poetry.lock* ./ 
RUN poetry config virtualenvs.create false \
 && poetry export --without-hashes -f requirements.txt -o requirements.txt \
 && python -m venv /opt/venv \
 && /opt/venv/bin/pip install --upgrade pip \
 && /opt/venv/bin/pip install --timeout=240 --retries=5 --no-cache-dir -r requirements.txt

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
