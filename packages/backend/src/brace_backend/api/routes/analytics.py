import time

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status

from brace_backend.api.deps import get_optional_init_data, get_uow
from brace_backend.core.limiter import limiter
from brace_backend.core.logging import logger
from brace_backend.core.metrics import analytics_metrics
from brace_backend.core.security import TelegramInitData
from brace_backend.db.uow import UnitOfWork
from brace_backend.schemas.analytics import AnalyticsBatchIn, AnalyticsIngestResponse
from brace_backend.schemas.common import SuccessResponse
from brace_backend.services.analytics_service import analytics_service
from brace_backend.core.config import settings

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.post("/events", response_model=SuccessResponse[AnalyticsIngestResponse])
@limiter.limit(settings.analytics_rate_limit)
async def ingest_events(
    request: Request,
    payload: AnalyticsBatchIn = Body(...),
    init_data: TelegramInitData | None = Depends(get_optional_init_data),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[AnalyticsIngestResponse]:
    start = time.perf_counter()
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    try:
        ingested, deduped = await analytics_service.ingest_batch(
            uow,
            payload,
            init_data,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    except ValueError as exc:
        analytics_metrics.record_error()
        logger.warning("analytics_ingest_rejected", reason=str(exc))
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    finally:
        latency_ms = (time.perf_counter() - start) * 1000
        analytics_metrics.record_ingest(latency_ms)
    return SuccessResponse(data=AnalyticsIngestResponse(ingested=ingested, deduped=deduped))


@router.get("/health", response_model=SuccessResponse[dict[str, object]])
async def analytics_health() -> SuccessResponse[dict[str, object]]:
    snapshot = analytics_metrics.snapshot()
    error_rate = (
        snapshot.ingest_errors / snapshot.ingest_requests
        if snapshot.ingest_requests
        else 0.0
    )
    return SuccessResponse(
        data={
            "ingest_requests": snapshot.ingest_requests,
            "ingest_errors": snapshot.ingest_errors,
            "error_rate": error_rate,
            "last_ingest_at": snapshot.last_ingest_at.isoformat() if snapshot.last_ingest_at else None,
            "last_error_at": snapshot.last_error_at.isoformat() if snapshot.last_error_at else None,
            "avg_latency_ms": snapshot.avg_latency_ms,
        }
    )
