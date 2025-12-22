from __future__ import annotations

from datetime import datetime

from sqlalchemy import Date, DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from brace_backend.domain.base import BaseModel


class AnalyticsReport(BaseModel):
    __tablename__ = "analytics_reports"

    report_date: Mapped[datetime] = mapped_column(Date, nullable=False, index=True)
    report_type: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    content: Mapped[str] = mapped_column(String(4096), nullable=False)
    meta: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


__all__ = ["AnalyticsReport"]
