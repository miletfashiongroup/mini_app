from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from brace_backend.domain.base import BaseModel


class ReferralCode(BaseModel):
    __tablename__ = "referral_code"

    owner_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(16), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    bindings: Mapped[list[ReferralBinding]] = relationship(
        "ReferralBinding", back_populates="code", cascade="all, delete-orphan"
    )


class ReferralBinding(BaseModel):
    __tablename__ = "referral_binding"

    referrer_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    referee_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    code_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("referral_code.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(String(16), nullable=False)
    order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    reason_code: Mapped[str | None] = mapped_column(String(32))
    approved_at: Mapped[datetime | None]

    code: Mapped[ReferralCode] = relationship("ReferralCode", back_populates="bindings")


__all__ = ["ReferralCode", "ReferralBinding"]
