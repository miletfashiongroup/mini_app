from uuid import UUID

from fastapi import APIRouter, Depends, Query

from brace_backend.api.deps import get_uow
from brace_backend.api.params import PaginationParams
from brace_backend.db.uow import UnitOfWork
from brace_backend.schemas.common import Pagination, SuccessResponse
from brace_backend.schemas.products import ProductRead
from brace_backend.schemas.reviews import ProductReviewRead
from brace_backend.services.product_service import product_service
from brace_backend.services.review_service import review_service

router = APIRouter(prefix="/products", tags=["Products"])


def _build_pagination_metadata(
    *, total: int, page: int, page_size: int, unpaged: bool
) -> Pagination:
    if unpaged:
        safe_page_size = max(1, total)
        return Pagination(page=1, page_size=safe_page_size, total=total, pages=1)
    pages = max(1, (total + page_size - 1) // page_size)
    return Pagination(page=page, page_size=page_size, total=total, pages=pages)


@router.get("", response_model=SuccessResponse[list[ProductRead]])
async def list_products(
    pagination: PaginationParams = Depends(),
    category: str | None = Query(default=None),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[ProductRead]]:
    total_items = 0
    page, page_size, unpaged = pagination.normalized(total_items=total_items)
    products, total = await product_service.list_products(
        uow,
        page=None if unpaged else page,
        page_size=None if unpaged else page_size,
        category=category,
    )
    pagination_meta = _build_pagination_metadata(
        total=len(products) if unpaged else total,
        page=1 if unpaged else page,
        page_size=len(products) if unpaged else page_size,
        unpaged=unpaged,
    )
    return SuccessResponse[list[ProductRead]](data=products, pagination=pagination_meta)


@router.get("/{product_id}", response_model=SuccessResponse[ProductRead])
async def get_product(
    product_id: UUID,
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[ProductRead]:
    product = await product_service.get_product(uow, product_id)
    return SuccessResponse[ProductRead](data=product)


@router.get("/{product_id}/related", response_model=SuccessResponse[list[ProductRead]])
async def related_products(
    product_id: UUID,
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[ProductRead]]:
    items = await product_service.list_related(uow, product_id=product_id)
    return SuccessResponse[list[ProductRead]](data=items)


@router.get("/{product_id}/reviews", response_model=SuccessResponse[list[ProductReviewRead]])
async def product_reviews(
    product_id: UUID,
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[ProductReviewRead]]:
    reviews = await review_service.list_product_reviews(uow, product_id)
    return SuccessResponse[list[ProductReviewRead]](data=reviews)
