from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from pydantic import AliasChoices, Field, ValidationError, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_MONOREPO_ROOT = Path(__file__).resolve().parents[4]
_BACKEND_ROOT = Path(__file__).resolve().parents[3]
_DEFAULT_ENV_FILES = (".env", ".env.local")


def _resolve_env_files() -> tuple[str, ...]:
    env_override = os.getenv("BRACE_ENV_FILE")
    if env_override:
        return (env_override,)

    candidates: list[str] = []
    for base_dir in (_MONOREPO_ROOT, _BACKEND_ROOT):
        for filename in _DEFAULT_ENV_FILES:
            candidates.append(str(base_dir / filename))

    return tuple(dict.fromkeys(candidates))  # preserve order without duplicates


class Settings(BaseSettings):
    """Strongly-typed application settings that are shared across ASGI, workers, and tooling."""

    app_name: str = "BRACE Backend"
    environment: str = Field(
        default="development",
        description="Application environment: development, staging, production",
    )
    log_level: str = Field(
        default="INFO",
        description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL",
    )
    log_json: bool = Field(
        default=True,
        description="Use JSON format for logs (recommended for production)",
    )
    log_format: str = Field(
        default="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level} | trace_id={extra[trace_id]} | {message}",
        description="Log format string (used when log_json=False)",
    )
    trace_header: str = Field(
        default="X-Trace-Id",
        description="HTTP header name for trace ID",
    )
    allow_dev_mode: bool = Field(
        default=False,
        description="Allow dev mode shortcuts (NEVER enable in production!)",
    )

    # Psycopg's async driver ships pre-built wheels, so it stays compatible with Python 3.14+
    # without requiring users to compile asyncpg locally.
    database_url: str = Field(
        default="postgresql+psycopg_async://postgres:postgres@db:5432/brace",
        validation_alias=AliasChoices("BRACE_DATABASE_URL", "DATABASE_URL"),
        description="PostgreSQL connection string (async driver)",
    )
    database_echo: bool = Field(
        default=False,
        description="Echo SQL queries to logs (NEVER enable in production!)",
    )
    database_pool_size: int = Field(
        default=5,
        ge=1,
        le=50,
        description="Database connection pool size",
    )
    database_max_overflow: int = Field(
        default=5,
        ge=0,
        le=50,
        description="Maximum overflow connections in pool",
    )
    redis_url: str = Field(
        default="memory://",
        description="Redis URL for rate limiting (use 'memory://' for in-memory fallback)",
    )
    disable_rate_limit: bool = Field(
        default=False,
        description="Disable SlowAPI rate limiting (set true in tests/local when Redis is unavailable).",
    )

    # ### IMPORTANT — Place BRACE_TELEGRAM_BOT_TOKEN in production environments:
    # # .env
    # # infra/docker-compose.prod.yml
    # # k8s/deploy.yaml
    telegram_bot_token: str | None = Field(default=None)

    telegram_webapp_secret: str | None = None
    telegram_dev_mode: bool = False
    telegram_dev_fallback_token: str = Field(
        default="dev-telegram-token",
        description="Used ONLY in dev mode when no real bot token is configured.",
    )
    telegram_dev_user: dict[str, Any] = {
        "id": 999_000,
        "first_name": "Dev",
        "last_name": "User",
        "username": "brace_dev",
        "language_code": "en",
    }
    telegram_debug_logging: bool = False
    telegram_emergency_bypass: bool = False

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"

    @property
    def telegram_dev_mode_enabled(self) -> bool:
        """Only allow Telegram WebApp dev payloads in trusted developer environments."""
        if self.is_production:
            return False  # Never allow dev mode in production
        return (
            self.is_development
            and self.allow_dev_mode
            and self.telegram_dev_mode
        )

    @property
    def sync_database_url(self) -> str:
        from brace_backend.core.database import ensure_sync_dsn

        return ensure_sync_dsn(self.database_url)

    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost",
            "http://localhost:4173",
            "http://localhost:5173",
        ],
        description="Allowed CORS origins (JSON array string or comma-separated)",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS origins from JSON array string or comma-separated string."""
        if isinstance(v, str):
            # Try to parse as JSON array first
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(origin) for origin in parsed]
            except (json.JSONDecodeError, TypeError):
                pass
            # Fallback to comma-separated string
            if "," in v:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
            # Single value
            return [v.strip()] if v.strip() else []
        if isinstance(v, list):
            return [str(origin) for origin in v]
        return v if v else []

    rate_limit: str = Field(
        default="60/minute",
        description="Rate limit string (e.g., '60/minute', '100/hour')",
    )

    model_config = SettingsConfigDict(
        env_file=_resolve_env_files(),  # PRINCIPAL-FIX: load monorepo-root .env consistently
        env_prefix="BRACE_",
        extra="ignore",
        case_sensitive=False,  # Allow case-insensitive env vars
        validate_assignment=True,  # Validate on assignment
    )

    @model_validator(mode="after")
    def ensure_telegram_credentials(self) -> Settings:
        """Allow both BRACE_* and bare Telegram env vars while enforcing presence."""
        prod_token = (self.telegram_bot_token or os.getenv("TELEGRAM_BOT_TOKEN") or "").strip()
        dev_token = (
            os.getenv("BRACE_TELEGRAM_DEV_TOKEN", "").strip() or self.telegram_dev_fallback_token
        )
        bot_token = prod_token
        using_dev_token = False

        if not bot_token and self.is_development and self.allow_dev_mode and self.telegram_dev_mode:
            bot_token = dev_token
            using_dev_token = True

        if not bot_token:
            raise ValueError(
                "Telegram bot token is required. "
                "Set BRACE_TELEGRAM_BOT_TOKEN or TELEGRAM_BOT_TOKEN."
            )
        if self.is_production and using_dev_token:
            raise ValueError("Dev Telegram token is not allowed in production.")
        # Use object.__setattr__ to bypass validate_assignment and avoid recursion
        if self.telegram_bot_token != bot_token:
            object.__setattr__(self, "telegram_bot_token", bot_token)

        webapp_secret = (
            self.telegram_webapp_secret or os.getenv("TELEGRAM_WEBAPP_SECRET") or ""
        ).strip()
        # Use object.__setattr__ to bypass validate_assignment and avoid recursion
        if self.telegram_webapp_secret != webapp_secret:
            object.__setattr__(self, "telegram_webapp_secret", webapp_secret or None)
        return self

    @model_validator(mode="after")
    def ensure_production_safety(self) -> Settings:
        """Fail fast when production safety rails are violated."""
        if not self.is_production:
            return self

        redis_url = (self.redis_url or "").strip()
        if not redis_url or redis_url == "memory://":
            raise RuntimeError("Redis is required in production; configure a redis:// URL.")

        if self.allow_dev_mode or self.telegram_dev_mode or bool(self.telegram_dev_fallback_token):
            raise RuntimeError("Dev mode is not allowed in production")

        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as exc:  # pragma: no cover - fails fast during startup
        raise RuntimeError(
            "Telegram credentials are required. Define BRACE_TELEGRAM_BOT_TOKEN "
            "or TELEGRAM_BOT_TOKEN in .env, infra/docker-compose.prod.yml, and k8s/deploy.yaml."
        ) from exc


settings = get_settings()
