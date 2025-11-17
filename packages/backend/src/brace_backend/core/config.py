from functools import lru_cache
from typing import Any

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised configuration shared by FastAPI, Alembic and background jobs."""

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
    telegram_bot_token: str = ""
    telegram_webapp_secret: str = ""
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
    return Settings()


settings = get_settings()
