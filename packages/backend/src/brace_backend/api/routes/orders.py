from fastapi import APIRouter, Depends, Request

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.api.params import PaginationParams
from brace_backend.core.limiter import limiter
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.common import Pagination, SuccessResponse
from brace_backend.schemas.orders import OrderCreate, OrderRead
from brace_backend.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=SuccessResponse[list[OrderRead]])
@limiter.limit("20/minute")
async def list_orders(
    request: Request,
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[list[OrderRead]]:
    page, page_size, unpaged = pagination.normalized(total_items=0)
    orders, total = await order_service.list_orders(
        uow,
        current_user.id,
        page=None if unpaged else page,
        page_size=None if unpaged else page_size,
    )
    pagination_meta = Pagination(
        page=1 if unpaged else page,
        page_size=len(orders) if unpaged else page_size,
        total=len(orders) if unpaged else total,
        pages=1 if unpaged else max(1, (total + page_size - 1) // page_size),
    )
    return SuccessResponse[list[OrderRead]](data=orders, pagination=pagination_meta)


@router.post("", response_model=SuccessResponse[OrderRead], status_code=201)
@limiter.limit("10/minute")
async def create_order(
    request: Request,
    payload: OrderCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[OrderRead]:
    order = await order_service.create_order(uow, user_id=current_user.id, payload=payload)
    return SuccessResponse[OrderRead](data=order)
