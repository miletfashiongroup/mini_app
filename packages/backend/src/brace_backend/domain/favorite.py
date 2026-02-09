from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from brace_backend.domain.base import BaseModel
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from brace_backend.domain.product import Product, ProductVariant
    from brace_backend.domain.user import User


class FavoriteItem(BaseModel):
    __tablename__ = "favorite_items"
    __table_args__ = (
        UniqueConstraint("user_id", "variant_id", name="uniq_favorite_item_variant"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    variant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("product_variants.id", ondelete="CASCADE"))
    size: Mapped[str] = mapped_column()

    user: Mapped[User] = relationship(back_populates="favorite_items")
    product: Mapped[Product] = relationship()
    variant: Mapped[ProductVariant] = relationship()
