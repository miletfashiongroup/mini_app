from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from brace_backend.models.base import BaseModel


class User(BaseModel):
    __tablename__ = "users"

    telegram_id: Mapped[int] = mapped_column(unique=True, index=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(255))
    last_name: Mapped[Optional[str]] = mapped_column(String(255))
    username: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    language_code: Mapped[Optional[str]] = mapped_column(String(10))

    orders: Mapped[list["Order"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    cart_items: Mapped[list["CartItem"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
