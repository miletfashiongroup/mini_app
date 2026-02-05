from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from brace_backend.domain.base import BaseModel


class SupportTicket(BaseModel):
    __tablename__ = "support_tickets"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"))
    status: Mapped[str] = mapped_column(String(16), default="open", nullable=False)
    priority: Mapped[str] = mapped_column(String(16), default="normal", nullable=False)
    subject: Mapped[str] = mapped_column(String(128), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    manager_comment: Mapped[str | None] = mapped_column(Text)
    manager_user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)


__all__ = ["SupportTicket"]
