from __future__ import annotations

import uuid

from brace_backend.domain.base import BaseModel
from sqlalchemy import JSON, BigInteger, Boolean, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator


class StringList(TypeDecorator):
    """Portable string list stored as ARRAY on Postgres and JSON elsewhere."""

    impl = ARRAY(String)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(ARRAY(String))
        return dialect.type_descriptor(JSON)

    def process_bind_param(self, value, dialect):
        return value or []

    def process_result_value(self, value, dialect):
        return value or []


class Product(BaseModel):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    hero_media_url: Mapped[str | None] = mapped_column(String(512))
    category: Mapped[str | None] = mapped_column(String(50))
    is_new: Mapped[bool] = mapped_column(Boolean, default=False)
    rating_value: Mapped[float] = mapped_column(Float, default=0)
    rating_count: Mapped[int] = mapped_column(default=0)
    tags: Mapped[list[str]] = mapped_column(StringList(), default=list)
    specs: Mapped[list[str]] = mapped_column(StringList(), default=list)

    variants: Mapped[list[ProductVariant]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    gallery: Mapped[list[ProductMedia]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductMedia.sort_order"
    )
    order_items: Mapped[list[OrderItem]] = relationship(back_populates="product")
    cart_items: Mapped[list[CartItem]] = relationship(back_populates="product")


class ProductVariant(BaseModel):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    size: Mapped[str] = mapped_column(String(10), nullable=False)
    price_minor_units: Mapped[int] = mapped_column(BigInteger, nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)

    product: Mapped[Product] = relationship(back_populates="variants")


class ProductMedia(BaseModel):
    __tablename__ = "product_media"

    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0)

    product: Mapped[Product] = relationship(back_populates="gallery")
