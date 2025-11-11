from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.api.deps import get_current_init_data, get_db
from brace_backend.core.security import TelegramInitData
from brace_backend.models import CartItem, Product, User
from brace_backend.schemas.common import CartItem as CartItemSchema, CartItemCreate
from brace_backend.services.user_service import upsert_user

router = APIRouter(prefix="/cart", tags=["Cart"])


def serialize_cart_item(item: CartItem) -> CartItemSchema:
    return CartItemSchema(
        id=item.id,
        product_id=item.product_id,
        product_name=item.product.name,
        size=item.size,
        quantity=item.quantity,
        unit_price=float(item.unit_price),
        hero_media_url=item.product.hero_media_url,
    )


@router.get("")
async def get_cart(
    init_data: TelegramInitData = Depends(get_current_init_data),
    session: AsyncSession = Depends(get_db),
) -> dict[str, list[CartItemSchema]]:
    user = await upsert_user(session, init_data)
    stmt = select(CartItem).where(CartItem.user_id == user.id)
    result = await session.scalars(stmt)
    items = result.unique().all()
    return {"items": [serialize_cart_item(item) for item in items]}


@router.post("")
async def add_to_cart(
    payload: CartItemCreate,
    init_data: TelegramInitData = Depends(get_current_init_data),
    session: AsyncSession = Depends(get_db),
) -> CartItemSchema:
    user = await upsert_user(session, init_data)

    product = await session.scalar(select(Product).where(Product.id == payload.product_id))
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        item = CartItem(
            user_id=user.id,
            product_id=product.id,
            size=payload.size,
            quantity=payload.quantity,
            unit_price=product.variants[0].price if product.variants else 0,
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)
        return serialize_cart_item(item)
    except IntegrityError:
        await session.rollback()
        stmt = select(CartItem).where(
            CartItem.user_id == user.id,
            CartItem.product_id == product.id,
            CartItem.size == payload.size,
        )
        existing = await session.scalar(stmt)
        if not existing:
            raise HTTPException(status_code=400, detail="Unable to add cart item")
        existing.quantity += payload.quantity
        await session.commit()
        await session.refresh(existing)
        return serialize_cart_item(existing)


@router.delete("/{item_id}")
async def remove_from_cart(
    item_id: str,
    init_data: TelegramInitData = Depends(get_current_init_data),
    session: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    user = await upsert_user(session, init_data)
    stmt = select(CartItem).where(CartItem.id == item_id, CartItem.user_id == user.id)
    item = await session.scalar(stmt)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await session.delete(item)
    await session.commit()
    return {"status": "deleted"}
