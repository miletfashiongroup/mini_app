from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised configuration shared by FastAPI, Alembic and background jobs."""

    app_name: str = "BRACE Backend"
    environment: str = "development"
    log_level: str = "INFO"

    # Psycopg's async driver ships pre-built wheels, so it stays compatible with Python 3.14+
    # without requiring users to compile asyncpg locally.
    database_url: str = "postgresql+psycopg_async://postgres:postgres@db:5432/brace"
    redis_url: str = "redis://redis:6379/0"

    telegram_bot_token: str = ""
    telegram_webapp_secret: str = ""

    cors_origins: List[str] = ["http://localhost", "http://localhost:4173"]

    rate_limit: str = "60/minute"

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"), env_prefix="BRACE_", extra="ignore"
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
