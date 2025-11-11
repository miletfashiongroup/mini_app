from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.api.deps import get_current_init_data, get_db
from brace_backend.core.security import TelegramInitData
from brace_backend.models import CartItem, Order, OrderItem
from brace_backend.schemas.common import Order as OrderSchema, OrderCreate
from brace_backend.services.user_service import upsert_user

router = APIRouter(prefix="/orders", tags=["Orders"])


def serialize_order(order: Order) -> OrderSchema:
    return OrderSchema(
        id=order.id,
        status=order.status,
        total_amount=float(order.total_amount),
        created_at=order.created_at,
        items=[
            {
                "id": item.id,
                "product_id": item.product_id,
                "size": item.size,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in order.items
        ],
    )


@router.get("")
async def list_orders(
    init_data: TelegramInitData = Depends(get_current_init_data),
    session: AsyncSession = Depends(get_db),
) -> dict[str, list[OrderSchema]]:
    user = await upsert_user(session, init_data)
    stmt = select(Order).where(Order.user_id == user.id).order_by(Order.created_at.desc())
    orders = await session.scalars(stmt)
    return {"items": [serialize_order(order) for order in orders.unique().all()]}


@router.post("")
async def create_order(
    _: OrderCreate,
    init_data: TelegramInitData = Depends(get_current_init_data),
    session: AsyncSession = Depends(get_db),
) -> OrderSchema:
    user = await upsert_user(session, init_data)
    cart_stmt = select(CartItem).where(CartItem.user_id == user.id)
    cart_items = await session.scalars(cart_stmt)
    items = cart_items.unique().all()
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    order = Order(user_id=user.id, status="pending")
    session.add(order)
    await session.flush()

    total_amount = 0
    for item in items:
        line_total = float(item.unit_price) * item.quantity
        total_amount += line_total
        session.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                size=item.size,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
        )
        await session.delete(item)

    order.total_amount = total_amount
    await session.commit()
    await session.refresh(order)
    return serialize_order(order)
