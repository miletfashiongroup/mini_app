from __future__ import annotations

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from brace_backend.domain.favorite import FavoriteItem
from brace_backend.domain.product import Product, ProductVariant
from brace_backend.repositories.base import SQLAlchemyRepository


class FavoriteRepository(SQLAlchemyRepository[FavoriteItem]):
    model = FavoriteItem

    def _base_stmt(self):
        return (
            select(FavoriteItem)
            .join(Product, FavoriteItem.product_id == Product.id)
            .join(ProductVariant, FavoriteItem.variant_id == ProductVariant.id)
            .where(Product.is_deleted.is_(False), ProductVariant.is_deleted.is_(False))
            .options(
                selectinload(FavoriteItem.product),
                selectinload(FavoriteItem.variant),
            )
        )

    async def list_for_user(self, user_id: UUID) -> Sequence[FavoriteItem]:
        stmt = self._base_stmt().where(FavoriteItem.user_id == user_id)
        result = await self.session.scalars(stmt)
        return result.unique().all()

    async def find_existing(
        self, *, user_id: UUID, product_id: UUID, variant_id: UUID
    ) -> FavoriteItem | None:
        stmt = self._base_stmt().where(
            FavoriteItem.user_id == user_id,
            FavoriteItem.product_id == product_id,
            FavoriteItem.variant_id == variant_id,
        )
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()

    async def delete_for_user(
        self, *, user_id: UUID, product_id: UUID, size: str
    ) -> bool:
        stmt = select(FavoriteItem).where(
            FavoriteItem.user_id == user_id,
            FavoriteItem.product_id == product_id,
            FavoriteItem.size == size,
        )
        item = await self.session.scalar(stmt)
        if not item:
            return False
        await self.session.delete(item)
        return True
