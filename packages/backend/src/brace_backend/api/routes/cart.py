from uuid import UUID

from fastapi import APIRouter, Depends, Request, status

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.limiter import limiter
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.cart import CartCollection, CartItemCreate, CartItemRead, CartItemUpdate
from brace_backend.schemas.common import SuccessResponse
from brace_backend.services.cart_service import cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=SuccessResponse[CartCollection])
@limiter.limit("30/minute")
async def get_cart(
    request: Request,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[CartCollection]:
    cart = await cart_service.get_cart(uow, current_user.id)
    return SuccessResponse[CartCollection](data=cart)


@router.post("", response_model=SuccessResponse[CartItemRead], status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def add_to_cart(
    request: Request,
    payload: CartItemCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[CartItemRead]:
    item = await cart_service.add_item(uow, user_id=current_user.id, payload=payload)
    return SuccessResponse[CartItemRead](data=item)


@router.delete("/{item_id}", response_model=SuccessResponse[dict[str, str]])
@limiter.limit("30/minute")
async def remove_from_cart(
    request: Request,
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[dict[str, str]]:
    await cart_service.remove_item(uow, user_id=current_user.id, item_id=item_id)
    return SuccessResponse(data={"status": "removed"})


@router.patch("/{item_id}", response_model=SuccessResponse[CartItemRead])
@limiter.limit("30/minute")
async def update_cart_item(
    request: Request,
    item_id: UUID,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[CartItemRead]:
    item = await cart_service.update_item(uow, user_id=current_user.id, item_id=item_id, payload=payload)
    return SuccessResponse[CartItemRead](data=item)
