from __future__ import annotations

from uuid import UUID

from brace_backend.db.uow import UnitOfWork
from brace_backend.core.exceptions import NotFoundError, ValidationError
from brace_backend.domain.review import ProductReviewVote
from brace_backend.schemas.reviews import (
    ProductReviewMediaRead,
    ProductReviewRead,
    ProductReviewVoteResponse,
)


class ReviewService:
    async def list_product_reviews(
        self,
        uow: UnitOfWork,
        product_id: UUID,
        *,
        user_id: UUID | None = None,
    ) -> list[ProductReviewRead]:
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
        user_votes_map: dict[UUID, int] = {}
        if user_id and review_ids:
            user_votes_map = await uow.reviews.list_user_votes(review_ids, user_id)

        result: list[ProductReviewRead] = []
        for review in reviews:
            size_label, purchase_date = review_meta.get(review.id, (None, None))
            helpful_count, not_helpful_count = votes_map.get(review.id, (0, 0))
            user_vote = user_votes_map.get(review.id, 0)
            author_name = "Покупатель"
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
                    user_vote=user_vote,
                    size_label=size_label,
                    purchase_date=purchase_date,
                    media=media_map.get(review.id, []),
                )
            )
        return result

    async def vote_review(
        self,
        uow: UnitOfWork,
        review_id: UUID,
        *,
        user_id: UUID,
        vote: int,
    ) -> ProductReviewVoteResponse:
        if vote not in (-1, 0, 1):
            raise ValidationError("Vote must be -1, 0, or 1.")

        review = await uow.reviews.get(review_id)
        if not review or review.status != "published":
            raise NotFoundError("Review not found.")

        existing_vote = await uow.reviews.get_user_vote(review_id, user_id)
        if vote == 0:
            if existing_vote:
                await uow.reviews.delete(existing_vote)
        else:
            if existing_vote:
                if existing_vote.vote == vote:
                    await uow.reviews.delete(existing_vote)
                    vote = 0
                else:
                    existing_vote.vote = vote
            else:
                await uow.reviews.add(
                    ProductReviewVote(review_id=review_id, user_id=user_id, vote=vote)
                )

        await uow.commit()

        votes_summary = await uow.reviews.list_votes_summary([review_id])
        helpful_count, not_helpful_count = (0, 0)
        if votes_summary:
            _, helpful_count, not_helpful_count = votes_summary[0]

        return ProductReviewVoteResponse(
            review_id=review_id,
            helpful_count=helpful_count,
            not_helpful_count=not_helpful_count,
            user_vote=vote,
        )


review_service = ReviewService()

__all__ = ["review_service", "ReviewService"]
