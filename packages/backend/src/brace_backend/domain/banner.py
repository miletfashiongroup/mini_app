from __future__ import annotations

from brace_backend.domain.base import BaseModel, SoftDeleteMixin
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column


class Banner(BaseModel, SoftDeleteMixin):
    __tablename__ = "banners"

    image_url: Mapped[str] = mapped_column(String(512), nullable=False)
    video_url: Mapped[str | None] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


__all__ = ["Banner"]
