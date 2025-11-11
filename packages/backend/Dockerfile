# syntax=docker/dockerfile:1.7

FROM python:3.12-slim AS base
ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

FROM base AS builder
RUN pip install poetry==1.8.3
# Copy only backend manifests to keep Docker layer cache stable.
COPY packages/backend/pyproject.toml packages/backend/poetry.lock* ./ 
RUN poetry export -f requirements.txt --without-hashes -o requirements.txt

FROM base AS runtime
COPY --from=builder /app/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
COPY packages/backend/src ./src
COPY packages/backend/alembic ./alembic
COPY packages/backend/alembic.ini ./alembic.ini
ENV PYTHONPATH=/app/src
CMD ["uvicorn", "brace_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
