from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from brace_backend.domain.base import BaseModel


class SupportMessage(BaseModel):
    __tablename__ = "support_messages"

    ticket_id: Mapped[UUID] = mapped_column(ForeignKey("support_tickets.id", ondelete="CASCADE"))
    sender: Mapped[str] = mapped_column(String(16), nullable=False)  # "user" | "admin"
    text: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)


__all__ = ["SupportMessage"]
