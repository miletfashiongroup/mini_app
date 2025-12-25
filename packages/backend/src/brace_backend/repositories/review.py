from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import Select, case, func, select

from brace_backend.domain.order import Order, OrderItem
from brace_backend.domain.review import ProductReview, ProductReviewMedia, ProductReviewVote
from brace_backend.repositories.base import SQLAlchemyRepository


class ProductReviewRepository(SQLAlchemyRepository[ProductReview]):
    model = ProductReview

    async def list_by_product(
        self, product_id: UUID
    ) -> Sequence[tuple[ProductReview, str | None, datetime | None]]:
        stmt: Select = (
            select(
                ProductReview,
                OrderItem.size,
                Order.created_at,
            )
            .outerjoin(OrderItem, ProductReview.order_item_id == OrderItem.id)
            .outerjoin(Order, OrderItem.order_id == Order.id)
            .where(ProductReview.product_id == product_id, ProductReview.status == "published")
            .order_by(ProductReview.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.all()

    async def list_media(self, review_ids: Sequence[UUID]) -> Sequence[ProductReviewMedia]:
        if not review_ids:
            return []
        stmt = (
            select(ProductReviewMedia)
            .where(ProductReviewMedia.review_id.in_(review_ids))
            .order_by(ProductReviewMedia.sort_order.asc(), ProductReviewMedia.created_at.asc())
        )
        result = await self.session.scalars(stmt)
        return result.all()

    async def list_votes_summary(self, review_ids: Sequence[UUID]) -> Sequence[tuple[UUID, int, int]]:
        if not review_ids:
            return []
        helpful_case = case((ProductReviewVote.vote == 1, 1), else_=0)
        not_helpful_case = case((ProductReviewVote.vote == -1, 1), else_=0)
        stmt = (
            select(
                ProductReviewVote.review_id,
                func.sum(helpful_case).label("helpful_count"),
                func.sum(not_helpful_case).label("not_helpful_count"),
            )
            .where(ProductReviewVote.review_id.in_(review_ids))
            .group_by(ProductReviewVote.review_id)
        )
        result = await self.session.execute(stmt)
        return [(row[0], int(row[1] or 0), int(row[2] or 0)) for row in result.all()]
