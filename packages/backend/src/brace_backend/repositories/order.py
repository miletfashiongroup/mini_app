from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from brace_backend.domain.order import Order, OrderItem
from brace_backend.domain.product import Product
from brace_backend.repositories.base import SQLAlchemyRepository


class OrderRepository(SQLAlchemyRepository[Order]):
    model = Order

    def _base_stmt(self):
        return select(Order).options(
            selectinload(Order.items)
            .selectinload(OrderItem.product)
            .selectinload(Product.gallery)
        )

    async def list_for_user(
        self, user_id: UUID, *, page: int | None = None, page_size: int | None = None
    ) -> tuple[Sequence[Order], int]:
        base_stmt = (
            self._base_stmt()
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        if page is None or page_size is None:
            result = await self.session.scalars(base_stmt)
            orders = result.unique().all()
            return orders, len(orders)

        offset = (page - 1) * page_size
        stmt = base_stmt.offset(offset).limit(page_size)
        result = await self.session.scalars(stmt)
        orders = result.unique().all()

        total_stmt = select(func.count()).select_from(
            select(Order.id).where(Order.user_id == user_id).subquery()
        )
        total = await self.session.scalar(total_stmt)
        return orders, int(total or 0)

    async def create(
        self,
        *,
        user_id: UUID,
        status: str = "pending",
        shipping_address: str | None = None,
        note: str | None = None,
        idempotency_key: str,
    ) -> Order:
        order = Order(
            user_id=user_id,
            status=status,
            shipping_address=shipping_address,
            note=note,
            idempotency_key=idempotency_key,
        )
        await self.add(order)
        await self.session.flush()
        return order

    async def add_item(
        self,
        order: Order,
        *,
        product_id: UUID,
        size: str,
        quantity: int,
        unit_price_minor_units: int,
    ) -> OrderItem:
        item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            size=size,
            quantity=quantity,
            unit_price_minor_units=unit_price_minor_units,
        )
        self.session.add(item)
        return item

    async def get_by_idempotency(self, *, user_id: UUID, idempotency_key: str) -> Order | None:
        stmt = self._base_stmt().where(
            Order.user_id == user_id, Order.idempotency_key == idempotency_key
        )
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()

    async def get_for_user(self, *, user_id: UUID, order_id: UUID) -> Order | None:
        stmt = self._base_stmt().where(Order.user_id == user_id, Order.id == order_id)
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()
