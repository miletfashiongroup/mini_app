from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from brace_backend.core.exceptions import AppError
from brace_backend.core.logging import logger
from brace_backend.schemas.common import BaseResponse, ErrorResponse


def _build_error_response(
    *,
    status_code: int,
    error_type: str,
    message: str,
) -> JSONResponse:
    payload = BaseResponse[Any](
        data=None,
        error=ErrorResponse(type=error_type, message=message),
    ).model_dump()
    return JSONResponse(status_code=status_code, content=payload)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:  # type: ignore[override]
        trace_id = getattr(request.state, "trace_id", None)
        logger.bind(trace_id=trace_id).warning(
            "Handled application error", code=exc.code, detail=exc.detail
        )
        return _build_error_response(
            status_code=exc.status_code,
            error_type=exc.code,
            message=exc.message,
        )

    @app.exception_handler(HTTPException)
    async def handle_http_error(request: Request, exc: HTTPException) -> JSONResponse:  # type: ignore[override]
        trace_id = getattr(request.state, "trace_id", None)
        logger.bind(trace_id=trace_id).warning(
            "HTTP exception", status_code=exc.status_code, detail=exc.detail
        )
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return _build_error_response(
            status_code=exc.status_code,
            error_type="http_error",
            message=detail,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:  # type: ignore[override]
        trace_id = getattr(request.state, "trace_id", None)
        logger.bind(trace_id=trace_id).warning("Request validation failed", errors=exc.errors())
        return _build_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_type="validation_error",
            message="Request validation failed",
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        request: Request, exc: Exception
    ) -> JSONResponse:  # type: ignore[override]
        trace_id = getattr(request.state, "trace_id", None)
        logger.bind(trace_id=trace_id).exception("Unhandled error")
        return _build_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_type="internal_error",
            message="Unexpected error",
        )
