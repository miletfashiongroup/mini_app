from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.exceptions import ValidationError
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.common import Pagination, SuccessResponse
from brace_backend.schemas.products import ProductRead
from brace_backend.schemas.reviews import ProductReviewRead, ProductReviewVoteRequest, ProductReviewVoteResponse
from brace_backend.services.product_service import product_service
from brace_backend.services.review_service import review_service

router = APIRouter(prefix="/products", tags=["Products"])


def _build_pagination_metadata(*, total: int, page: int, page_size: int) -> Pagination:
    pages = max(1, (total + page_size - 1) // page_size)
    return Pagination(page=page, page_size=page_size, total=total, pages=pages)


@router.get("", response_model=SuccessResponse[list[ProductRead]])
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    category: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[ProductRead]]:
    _ = current_user  # enforce authenticated/consented user before returning catalog
    category_filter = category or None
    try:
        products, total = await product_service.list_products(
            uow,
            page=page,
            page_size=page_size,
            category=category_filter,
        )
        pagination_meta = _build_pagination_metadata(
            total=total,
            page=page,
            page_size=page_size,
        )
        return SuccessResponse[list[ProductRead]](data=products, pagination=pagination_meta)
    except ValidationError as exc:
        if exc.message != "Active price is missing for a product variant.":
            raise
        products, total = await uow.products.list_products(
            page=page, page_size=page_size, category=category_filter
        )
        rating_stats = await uow.reviews.list_product_rating_stats([product.id for product in products])
        now = datetime.now(tz=timezone.utc)
        for product in products:
            for variant in product.variants:
                if variant.active_price_minor_units is not None:
                    continue
                await uow.session.refresh(variant, attribute_names=["prices"])
                active_price = None
                for price in sorted(variant.prices, key=lambda item: item.starts_at, reverse=True):
                    compare_now = now if price.starts_at.tzinfo else now.replace(tzinfo=None)
                    if price.starts_at <= compare_now and (
                        price.ends_at is None or price.ends_at > compare_now
                    ):
                        active_price = price.price_minor_units
                        break
                if active_price is None and variant.prices:
                    active_price = max(variant.prices, key=lambda item: item.starts_at).price_minor_units
                variant.active_price_minor_units = active_price
        mapped = [
            product_service._to_schema(
                product,
                rating_value_override=rating_stats.get(product.id, (product.rating_value, product.rating_count))[0],
                rating_count_override=rating_stats.get(product.id, (product.rating_value, product.rating_count))[1],
            )
            for product in products
        ]
        pagination_meta = _build_pagination_metadata(
            total=total,
            page=page,
            page_size=page_size,
        )
        return SuccessResponse[list[ProductRead]](data=mapped, pagination=pagination_meta)


@router.get("/{product_id}", response_model=SuccessResponse[ProductRead])
async def get_product(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[ProductRead]:
    _ = current_user
    product = await product_service.get_product(uow, product_id)
    return SuccessResponse[ProductRead](data=product)


@router.get("/{product_id}/related", response_model=SuccessResponse[list[ProductRead]])
async def related_products(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[ProductRead]]:
    _ = current_user
    items = await product_service.list_related(uow, product_id=product_id)
    return SuccessResponse[list[ProductRead]](data=items)


@router.get("/{product_id}/reviews", response_model=SuccessResponse[list[ProductReviewRead]])
async def product_reviews(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[ProductReviewRead]]:
    _ = current_user
    reviews = await review_service.list_product_reviews(uow, product_id, user_id=current_user.id)
    return SuccessResponse[list[ProductReviewRead]](data=reviews)


@router.post("/reviews/{review_id}/vote", response_model=SuccessResponse[ProductReviewVoteResponse])
async def vote_review(
    review_id: UUID,
    payload: ProductReviewVoteRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[ProductReviewVoteResponse]:
    result = await review_service.vote_review(uow, review_id, user_id=current_user.id, vote=payload.vote)
    return SuccessResponse[ProductReviewVoteResponse](data=result)


__all__ = ["router"]
