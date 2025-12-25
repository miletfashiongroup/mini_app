from __future__ import annotations

import uuid

from brace_backend.domain.base import BaseModel
from sqlalchemy import Boolean, ForeignKey, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship


class ProductReview(BaseModel):
    __tablename__ = "product_reviews"

    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    order_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("order_items.id"), nullable=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    external_review_id: Mapped[str | None] = mapped_column(String(64))
    external_user_id: Mapped[str | None] = mapped_column(String(64))
    external_order_ref: Mapped[str | None] = mapped_column(String(64))
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String(32), default="published")

    media: Mapped[list["ProductReviewMedia"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )
    votes: Mapped[list["ProductReviewVote"]] = relationship(
        back_populates="review", cascade="all, delete-orphan"
    )


class ProductReviewMedia(BaseModel):
    __tablename__ = "product_review_media"

    review_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("product_reviews.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(default=0)

    review: Mapped[ProductReview] = relationship(back_populates="media")


class ProductReviewVote(BaseModel):
    __tablename__ = "product_review_votes"

    review_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("product_reviews.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    external_user_id: Mapped[str | None] = mapped_column(String(64))
    vote: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    review: Mapped[ProductReview] = relationship(back_populates="votes")
