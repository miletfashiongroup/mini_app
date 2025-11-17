from __future__ import annotations

from math import ceil
from typing import Sequence
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.orm import selectinload

from brace_backend.domain.product import Product, ProductVariant
from brace_backend.repositories.base import SQLAlchemyRepository


class ProductRepository(SQLAlchemyRepository[Product]):
    model = Product

    def _base_stmt(self) -> Select[tuple[Product]]:
        return select(Product).options(selectinload(Product.variants))

    async def list_products(
        self, *, page: int | None = None, page_size: int | None = None
    ) -> tuple[Sequence[Product], int]:
        base_stmt = self._base_stmt().order_by(Product.created_at.desc())
        if page is None or page_size is None:
            result = await self.session.scalars(base_stmt)
            products = result.unique().all()
            return products, len(products)

        offset = (page - 1) * page_size
        stmt = base_stmt.offset(offset).limit(page_size)
        result = await self.session.scalars(stmt)
        products = result.unique().all()

        total_stmt = select(func.count()).select_from(Product)
        total = await self.session.scalar(total_stmt)
        return products, int(total or 0)

    async def get_with_variants(self, product_id: UUID) -> Product | None:
        stmt = self._base_stmt().where(Product.id == product_id)
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()

    async def get_variant_for_update(self, product_id: UUID, size: str) -> ProductVariant | None:
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.product_id == product_id, ProductVariant.size == size)
            .with_for_update()
        )
        return await self.session.scalar(stmt)
