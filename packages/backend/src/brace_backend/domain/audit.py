from __future__ import annotations

from datetime import datetime
from uuid import UUID

from brace_backend.domain.base import BaseModel
from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column


class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    actor_user_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(512))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


__all__ = ["AuditLog"]
