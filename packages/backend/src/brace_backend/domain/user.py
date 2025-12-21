from __future__ import annotations

from brace_backend.core.types import EncryptedString
from brace_backend.domain.base import BaseModel
from sqlalchemy import Date, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class User(BaseModel):
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(unique=True, index=True)
    first_name: Mapped[str | None] = mapped_column(EncryptedString(255))
    last_name: Mapped[str | None] = mapped_column(EncryptedString(255))
    username: Mapped[str | None] = mapped_column(EncryptedString(255))
    language_code: Mapped[str | None] = mapped_column(String(10))
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    full_name: Mapped[str | None] = mapped_column(EncryptedString(255))
    phone: Mapped[str | None] = mapped_column(EncryptedString(255))
    email: Mapped[str | None] = mapped_column(EncryptedString(255))
    email_opt_out: Mapped[bool] = mapped_column(default=False, nullable=False)
    birth_date: Mapped[Date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(10))
    consent_given_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    consent_text: Mapped[str | None] = mapped_column(String(512))
    consent_ip: Mapped[str | None] = mapped_column(String(64))
    consent_user_agent: Mapped[str | None] = mapped_column(String(512))
    profile_completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))

    orders: Mapped[list[Order]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    cart_items: Mapped[list[CartItem]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
