from __future__ import annotations

import threading
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class AnalyticsMetricsSnapshot:
    ingest_requests: int
    ingest_errors: int
    last_ingest_at: datetime | None
    last_error_at: datetime | None
    avg_latency_ms: float


class AnalyticsMetrics:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._ingest_requests = 0
        self._ingest_errors = 0
        self._last_ingest_at: datetime | None = None
        self._last_error_at: datetime | None = None
        self._latency_ms_sum = 0.0
        self._latency_ms_count = 0

    def record_ingest(self, latency_ms: float) -> None:
        with self._lock:
            self._ingest_requests += 1
            self._last_ingest_at = datetime.now(tz=timezone.utc)
            self._latency_ms_sum += latency_ms
            self._latency_ms_count += 1

    def record_error(self) -> None:
        with self._lock:
            self._ingest_errors += 1
            self._last_error_at = datetime.now(tz=timezone.utc)

    def snapshot(self) -> AnalyticsMetricsSnapshot:
        with self._lock:
            avg_latency = (
                self._latency_ms_sum / self._latency_ms_count if self._latency_ms_count else 0.0
            )
            return AnalyticsMetricsSnapshot(
                ingest_requests=self._ingest_requests,
                ingest_errors=self._ingest_errors,
                last_ingest_at=self._last_ingest_at,
                last_error_at=self._last_error_at,
                avg_latency_ms=avg_latency,
            )


analytics_metrics = AnalyticsMetrics()

__all__ = ["analytics_metrics", "AnalyticsMetricsSnapshot"]
