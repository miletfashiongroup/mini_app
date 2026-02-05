from __future__ import annotations

from uuid import UUID

from sqlalchemy import Integer, cast, func, select
from sqlalchemy.dialects import postgresql

from brace_backend.domain.support import SupportTicket
from brace_backend.repositories.base import SQLAlchemyRepository


class SupportTicketRepository(SQLAlchemyRepository[SupportTicket]):
    model = SupportTicket

    async def list_for_user(self, *, user_id: UUID, limit: int = 50, offset: int = 0) -> list[SupportTicket]:
        stmt = (
            select(SupportTicket)
            .where(SupportTicket.user_id == user_id)
            .order_by(SupportTicket.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return result.unique().all()

    async def list_all(
        self, *, status: str | None = None, limit: int = 100, offset: int = 0
    ) -> list[SupportTicket]:
        stmt = select(SupportTicket).order_by(SupportTicket.created_at.desc())
        if status:
            stmt = stmt.where(SupportTicket.status == status)
        stmt = stmt.offset(offset).limit(limit)
        result = await self.session.scalars(stmt)
        return result.unique().all()

    async def find_by_thread_id(self, thread_id: int) -> SupportTicket | None:
        json_thread_id = func.jsonb_extract_path_text(cast(SupportTicket.meta, postgresql.JSONB), "thread_id")
        stmt = select(SupportTicket).where(cast(json_thread_id, Integer) == thread_id)
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()


__all__ = ["SupportTicketRepository"]
