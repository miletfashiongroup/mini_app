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
    logger.remove()
    logger.configure(patcher=_patch_logger)
    logger.add(
        sys.stdout,
        level=settings.log_level,
        serialize=settings.log_json,
        enqueue=True,
        backtrace=settings.environment == "development",
        diagnose=settings.environment == "development",
        format=settings.log_format,
    )


__all__ = ["configure_logging", "get_trace_id", "logger", "set_trace_id"]
