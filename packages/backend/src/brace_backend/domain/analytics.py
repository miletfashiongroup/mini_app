from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from brace_backend.domain.base import BaseModel


class AnalyticsEvent(BaseModel):
    __tablename__ = "analytics_events"

    event_id: Mapped[UUID] = mapped_column(nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_version: Mapped[int] = mapped_column(default=1, nullable=False)
    schema_version: Mapped[int] = mapped_column(default=1, nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="client")

    session_id: Mapped[str | None] = mapped_column(String(64), index=True)
    device_id_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    anon_id_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    user_id_hash: Mapped[str | None] = mapped_column(String(64), index=True)
    screen: Mapped[str | None] = mapped_column(String(128))

    properties: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    context: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    ip_hash: Mapped[str | None] = mapped_column(String(64))
    user_agent_hash: Mapped[str | None] = mapped_column(String(64))


class AnalyticsDailyMetric(BaseModel):
    __tablename__ = "analytics_daily_metrics"

    metric_date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    metric_key: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    metric_value: Mapped[float] = mapped_column(nullable=False)
    dimensions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


__all__ = ["AnalyticsEvent", "AnalyticsDailyMetric"]
