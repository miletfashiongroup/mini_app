from __future__ import annotations

from uuid import UUID

from sqlalchemy import Integer, select, cast

from brace_backend.domain.support_message import SupportMessage
from brace_backend.domain.support import SupportTicket
from brace_backend.repositories.base import SQLAlchemyRepository


class SupportMessageRepository(SQLAlchemyRepository[SupportMessage]):
    model = SupportMessage

    async def list_for_ticket(self, *, ticket_id: UUID, limit: int = 100, offset: int = 0) -> list[SupportMessage]:
        stmt = (
            select(SupportMessage)
            .where(SupportMessage.ticket_id == ticket_id)
            .order_by(SupportMessage.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return result.unique().all()


class SupportTicketRepositoryMixin:
    async def find_by_thread_id(self, thread_id: int) -> SupportTicket | None:  # type: ignore[name-defined]
        stmt = select(SupportTicket).where(
            cast(SupportTicket.meta["thread_id"].astext, Integer) == thread_id
        )
        result = await self.session.scalars(stmt)
        return result.unique().one_or_none()
