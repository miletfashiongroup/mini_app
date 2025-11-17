from __future__ import annotations

import time
from uuid import uuid4

from brace_backend.core.config import settings
from brace_backend.core.logging import logger, set_trace_id
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Attach trace identifiers and provide structured request logging."""

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[override]
        trace_id = request.headers.get(settings.trace_header) or uuid4().hex
        request.state.trace_id = trace_id
        set_trace_id(trace_id)
        start = time.perf_counter()
        log = logger.bind(trace_id=trace_id, path=request.url.path, method=request.method)

        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            log.exception("Request failed", duration_ms=duration_ms)
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Trace-Id"] = trace_id
        log.info("Request completed", status_code=response.status_code, duration_ms=duration_ms)
        return response
