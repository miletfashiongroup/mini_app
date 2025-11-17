from uuid import UUID

from fastapi import APIRouter, Depends, status

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.cart import CartCollection, CartItemCreate, CartItemRead
from brace_backend.schemas.common import SuccessResponse
from brace_backend.services.cart_service import cart_service

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=SuccessResponse[CartCollection])
async def get_cart(
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[CartCollection]:
    cart = await cart_service.get_cart(uow, current_user.id)
    return SuccessResponse[CartCollection](data=cart)


@router.post("", response_model=SuccessResponse[CartItemRead], status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    payload: CartItemCreate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[CartItemRead]:
    item = await cart_service.add_item(uow, user_id=current_user.id, payload=payload)
    return SuccessResponse[CartItemRead](data=item)


@router.delete("/{item_id}", response_model=SuccessResponse[dict[str, str]])
async def remove_from_cart(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[dict[str, str]]:
    await cart_service.remove_item(uow, user_id=current_user.id, item_id=item_id)
    return SuccessResponse(data={"status": "removed"})
