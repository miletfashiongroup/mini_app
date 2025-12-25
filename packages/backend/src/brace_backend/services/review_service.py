from __future__ import annotations

from uuid import UUID

from brace_backend.db.uow import UnitOfWork
from brace_backend.schemas.reviews import ProductReviewMediaRead, ProductReviewRead


class ReviewService:
    async def list_product_reviews(self, uow: UnitOfWork, product_id: UUID) -> list[ProductReviewRead]:
        rows = await uow.reviews.list_by_product(product_id)
        reviews = [row[0] for row in rows]
        review_meta = {row[0].id: (row[1], row[2]) for row in rows}
        review_ids = [review.id for review in reviews]

        media_items = await uow.reviews.list_media(review_ids)
        votes_summary = await uow.reviews.list_votes_summary(review_ids)

        media_map: dict[UUID, list[ProductReviewMediaRead]] = {rid: [] for rid in review_ids}
        for media in media_items:
            media_map.setdefault(media.review_id, []).append(
                ProductReviewMediaRead(
                    id=media.id,
                    url=media.url,
                    sort_order=media.sort_order,
                    created_at=media.created_at,
                )
            )

        votes_map = {rid: (helpful, not_helpful) for rid, helpful, not_helpful in votes_summary}

        result: list[ProductReviewRead] = []
        for review in reviews:
            size_label, purchase_date = review_meta.get(review.id, (None, None))
            helpful_count, not_helpful_count = votes_map.get(review.id, (0, 0))
            author_name = "Аноним" if review.is_anonymous else "Покупатель"
            result.append(
                ProductReviewRead(
                    id=review.id,
                    product_id=review.product_id,
                    rating=review.rating,
                    text=review.text,
                    is_anonymous=review.is_anonymous,
                    status=review.status,
                    created_at=review.created_at,
                    updated_at=review.updated_at,
                    author_name=author_name,
                    helpful_count=helpful_count,
                    not_helpful_count=not_helpful_count,
                    size_label=size_label,
                    purchase_date=purchase_date,
                    media=media_map.get(review.id, []),
                )
            )
        return result


review_service = ReviewService()

__all__ = ["review_service", "ReviewService"]
