# BRACE Backend

FastAPI service for the BRACE Telegram Mini App.

## Features
- Telegram initData verification
- Product, cart, order, and user APIs
- Async SQLAlchemy + PostgreSQL
- Rate limiting, CORS, and structured config

## Local development
```bash
poetry install
poetry run uvicorn brace_backend.main:app --reload
```

## Testing
```bash
poetry run pytest
```

## Database
Apply migrations with Alembic:
```bash
poetry run alembic upgrade head
```

Seed demo products:
```bash
poetry run python -m brace_backend.services.seed
```

## Analytics
Run analytics tests:
```bash
poetry run pytest tests/test_analytics_ingest.py tests/test_analytics_schema.py
```
