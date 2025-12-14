from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from brace_backend.domain.base import BaseModel
from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from brace_backend.domain.product import Product, ProductVariant
    from brace_backend.domain.user import User


class CartItem(BaseModel):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "variant_id", name="uniq_cart_item_variant"),
        CheckConstraint("quantity > 0", name="ck_cart_quantity_positive"),
        CheckConstraint("unit_price_minor_units >= 0", name="ck_cart_price_nonnegative"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    variant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("product_variants.id", ondelete="CASCADE"))
    size: Mapped[str] = mapped_column()
    quantity: Mapped[int] = mapped_column(default=1)
    unit_price_minor_units: Mapped[int] = mapped_column(BigInteger, nullable=False)

    user: Mapped[User] = relationship(back_populates="cart_items")
    product: Mapped[Product] = relationship(back_populates="cart_items")
    variant: Mapped[ProductVariant] = relationship()
