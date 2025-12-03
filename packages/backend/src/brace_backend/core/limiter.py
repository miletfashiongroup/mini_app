from brace_backend.core.config import settings
from brace_backend.core.logging import logger
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address


def _create_limiter() -> Limiter:
    storage_uri = settings.redis_url
    storage_is_redis = storage_uri.startswith(("redis://", "rediss://"))

    if settings.is_production:
        if settings.disable_rate_limit or not storage_is_redis:
            raise RuntimeError("Redis-backed rate limiting is required in production.")
    else:
        if settings.disable_rate_limit or not storage_is_redis:
            storage_uri = "memory://"
    try:
        limiter = Limiter(
            key_func=get_remote_address,
            default_limits=[settings.rate_limit],
            storage_uri=storage_uri,
        )
        limiter._rate_limit_exceeded_handler = _safe_rate_limit_handler  # type: ignore[attr-defined]
        return limiter
    except Exception as exc:  # pragma: no cover
        logger.warning(
            "Rate limiter storage misconfigured; falling back to in-memory.",
            redis_url=settings.redis_url,
            error=str(exc),
        )
        limiter = Limiter(
            key_func=get_remote_address,
            default_limits=[settings.rate_limit],
            storage_uri="memory://",
        )
        limiter._rate_limit_exceeded_handler = _safe_rate_limit_handler  # type: ignore[attr-defined]
        return limiter


def _safe_rate_limit_handler(request, exc):
    message = getattr(exc, "detail", None) or str(exc) or "Rate limit exceeded"
    return JSONResponse({"error": f"Rate limit exceeded: {message}"}, status_code=429)


limiter = _create_limiter()

__all__ = ["limiter"]
