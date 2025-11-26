from __future__ import annotations

import sys
from contextvars import ContextVar
from typing import Any

from brace_backend.core.config import Settings
from loguru import logger

TRACE_ID_VAR: ContextVar[str | None] = ContextVar("trace_id", default=None)


def set_trace_id(trace_id: str | None) -> None:
    TRACE_ID_VAR.set(trace_id)


def get_trace_id() -> str | None:
    return TRACE_ID_VAR.get()


def _patch_logger(record: dict[str, Any]) -> None:
    record["extra"]["trace_id"] = get_trace_id() or "-"


def configure_logging(settings: Settings) -> None:
    """Configure logging based on environment settings.
    
    Production:
    - JSON format for log aggregation
    - No backtrace/diagnose (performance)
    - Structured logging with trace_id
    
    Development:
    - Human-readable format
    - Full backtrace and diagnose
    - More verbose output
    """
    logger.remove()
    logger.configure(patcher=_patch_logger)
    
    # Production: JSON structured logging
    if settings.is_production and settings.log_json:
        logger.add(
            sys.stdout,
            level=settings.log_level,
            serialize=True,  # JSON format for log aggregation
            enqueue=True,  # Async logging for better performance
            backtrace=False,  # Disable backtrace in production (performance)
            diagnose=False,  # Disable diagnose in production (security)
            format="{time} | {level} | {message}",
        )
    # Development or non-JSON: human-readable format
    else:
        logger.add(
            sys.stdout,
            level=settings.log_level,
            serialize=settings.log_json,
            enqueue=True,
            backtrace=settings.is_development,  # Full backtrace only in dev
            diagnose=settings.is_development,  # Full diagnose only in dev
            format=settings.log_format,
        )
    
    # Log startup configuration (only in development or with DEBUG level)
    if settings.is_development or settings.log_level == "DEBUG":
        logger.debug(
            "Logging configured",
            environment=settings.environment,
            log_level=settings.log_level,
            log_json=settings.log_json,
            is_production=settings.is_production,
        )


__all__ = ["configure_logging", "get_trace_id", "logger", "set_trace_id"]
