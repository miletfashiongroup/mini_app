from fastapi import FastAPI, Request
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from brace_backend.api import api_router
from brace_backend.core.config import settings
from brace_backend.core.error_handlers import register_exception_handlers
from brace_backend.core.limiter import limiter
from brace_backend.core.logging import configure_logging
from brace_backend.core.middleware import ObservabilityMiddleware

configure_logging(settings)


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version="0.2.0")

    app.add_middleware(ObservabilityMiddleware)
    Instrumentator().instrument(app).expose(app, include_in_schema=False)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.limiter = limiter
    if not settings.disable_rate_limit:
        app.add_middleware(SlowAPIMiddleware)

    app.include_router(api_router, prefix="/api")
    register_exception_handlers(app)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded):  # type: ignore[override]
        handler = getattr(limiter, "_rate_limit_exceeded_handler", None)
        if handler:
            return handler(request, exc)
        detail = getattr(exc, "detail", None) or str(exc) or "Rate limit exceeded"
        return JSONResponse({"error": f"Rate limit exceeded: {detail}"}, status_code=429)

    return app


app = create_app()
