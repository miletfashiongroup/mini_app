from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly-typed application settings that are shared across ASGI, workers, and tooling."""

    app_name: str = "BRACE Backend"
    environment: str = "development"
    log_level: str = "INFO"
    log_json: bool = True
    log_format: str = (
        "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | trace_id={extra[trace_id]} | {message}"
    )
    trace_header: str = "X-Trace-Id"

    # Psycopg's async driver ships pre-built wheels, so it stays compatible with Python 3.14+
    # without requiring users to compile asyncpg locally.
    database_url: str = "postgresql+psycopg_async://postgres:postgres@db:5432/brace"
    database_echo: bool = False
    database_pool_size: int = 5
    database_max_overflow: int = 5
    redis_url: str = "memory://"

    # ### IMPORTANT — Place BRACE_TELEGRAM_BOT_TOKEN in production environments:
    # # .env
    # # infra/docker-compose.prod.yml
    # # k8s/deploy.yaml
    telegram_bot_token: str = Field(..., min_length=1)

    telegram_webapp_secret: str | None = None
    telegram_dev_mode: bool = False
    telegram_dev_user: dict[str, Any] = {
        "id": 999_000,
        "first_name": "Dev",
        "last_name": "User",
        "username": "brace_dev",
        "language_code": "en",
    }

    cors_origins: list[str] = ["http://localhost", "http://localhost:4173"]

    rate_limit: str = "60/minute"

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"), env_prefix="BRACE_", extra="ignore"
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as exc:  # pragma: no cover - fails fast during startup
        raise RuntimeError(
            "BRACE_TELEGRAM_BOT_TOKEN is required. Add it to .env, "
            "infra/docker-compose.prod.yml, and k8s/deploy.yaml."
        ) from exc


settings = get_settings()
