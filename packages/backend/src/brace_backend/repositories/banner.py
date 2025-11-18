from __future__ import annotations

from sqlalchemy import select

from brace_backend.domain.banner import Banner
from brace_backend.repositories.base import SQLAlchemyRepository


class BannerRepository(SQLAlchemyRepository[Banner]):
    model = Banner

    async def list_ordered(self) -> list[Banner]:
        stmt = select(Banner).order_by(Banner.sort_order.asc(), Banner.created_at.asc())
        result = await self.session.scalars(stmt)
        return result.unique().all()


__all__ = ["BannerRepository"]
