from __future__ import annotations

import uuid
from datetime import datetime

from brace_backend.domain.base import BaseModel, SoftDeleteMixin
from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    and_,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
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


class Product(BaseModel, SoftDeleteMixin):
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
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
        primaryjoin="and_(ProductVariant.product_id==Product.id, ProductVariant.is_deleted==False)",
    )
    gallery: Mapped[list[ProductMedia]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductMedia.sort_order",
        lazy="selectin",
        primaryjoin="and_(ProductMedia.product_id==Product.id, ProductMedia.is_deleted==False)",
    )
    order_items: Mapped[list[OrderItem]] = relationship(back_populates="product")
    cart_items: Mapped[list[CartItem]] = relationship(back_populates="product")


class ProductPrice(BaseModel):
    __tablename__ = "product_prices"
    __table_args__ = (
        UniqueConstraint(
            "product_variant_id",
            "starts_at",
            name="uniq_price_variant_start",
        ),
        CheckConstraint("price_minor_units >= 0", name="ck_price_nonnegative"),
        CheckConstraint(
            "(ends_at IS NULL) OR (starts_at < ends_at)", name="ck_price_starts_before_ends"
        ),
    )

    product_variant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("product_variants.id", ondelete="CASCADE"), index=True
    )
    price_minor_units: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), default="RUB", nullable=False)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    variant: Mapped["ProductVariant"] = relationship(back_populates="prices")


class ProductVariant(BaseModel, SoftDeleteMixin):
    __tablename__ = "product_variants"
    __table_args__ = (
        UniqueConstraint("product_id", "size", name="uniq_variant_size"),
        CheckConstraint("stock >= 0", name="ck_variant_stock_nonnegative"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    size: Mapped[str] = mapped_column(String(10), nullable=False)
    stock: Mapped[int] = mapped_column(nullable=False, default=0)

    product: Mapped[Product] = relationship(back_populates="variants", lazy="joined")
    prices: Mapped[list["ProductPrice"]] = relationship(
        back_populates="variant", cascade="all, delete-orphan", order_by="ProductPrice.starts_at"
    )

    active_price_minor_units: Mapped[int | None] = column_property(
        select(ProductPrice.price_minor_units)
        .where(
            ProductPrice.product_variant_id == id,
            ProductPrice.starts_at <= func.now(),
            (ProductPrice.ends_at.is_(None)) | (ProductPrice.ends_at > func.now()),
        )
        .order_by(ProductPrice.starts_at.desc())
        .limit(1)
        .correlate_except(ProductPrice)
    )


class ProductMedia(BaseModel, SoftDeleteMixin):
    __tablename__ = "product_media"

    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0)

    product: Mapped[Product] = relationship(back_populates="gallery")
