from __future__ import annotations

from brace_backend.domain.base import BaseModel
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship


class User(BaseModel):
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(unique=True, index=True)
    first_name: Mapped[str | None] = mapped_column(String(255))
    last_name: Mapped[str | None] = mapped_column(String(255))
    username: Mapped[str | None] = mapped_column(String(255), index=True)
    language_code: Mapped[str | None] = mapped_column(String(10))

    orders: Mapped[list[Order]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    cart_items: Mapped[list[CartItem]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
