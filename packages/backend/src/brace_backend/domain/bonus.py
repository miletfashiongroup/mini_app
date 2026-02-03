from __future__ import annotations

from datetime import datetime
from uuid import UUID

from brace_backend.domain.base import BaseModel
from sqlalchemy import BigInteger, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class BonusLedger(BaseModel):
    __tablename__ = "bonus_ledger"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    order_id: Mapped[UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="SET NULL"))
    entry_type: Mapped[str] = mapped_column(String(16), nullable=False)
    amount: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reason: Mapped[str] = mapped_column(String(32), nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    related_entry_id: Mapped[UUID | None] = mapped_column(ForeignKey("bonus_ledger.id"))
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    related_entry: Mapped[BonusLedger | None] = relationship(remote_side="BonusLedger.id")


__all__ = ["BonusLedger"]
