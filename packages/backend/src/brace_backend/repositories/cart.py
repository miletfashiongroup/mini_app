from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from brace_backend.domain.cart import CartItem
from brace_backend.repositories.base import SQLAlchemyRepository


class CartRepository(SQLAlchemyRepository[CartItem]):
    model = CartItem

    def _base_stmt(self):
        return select(CartItem).options(selectinload(CartItem.product))

    async def get_for_user(self, user_id: UUID) -> Sequence[CartItem]:
        stmt = self._base_stmt().where(CartItem.user_id == user_id)
        result = await self.session.scalars(stmt)
        return result.unique().all()

    async def find_existing(self, *, user_id: UUID, product_id: UUID, size: str) -> CartItem | None:
        stmt = self._base_stmt().where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
            CartItem.size == size,
        )
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()

    async def delete_for_user(self, *, item_id: UUID, user_id: UUID) -> bool:
        item = await self.session.scalar(
            select(CartItem).where(CartItem.id == item_id, CartItem.user_id == user_id)
        )
        if not item:
            return False
        await self.session.delete(item)
        return True
