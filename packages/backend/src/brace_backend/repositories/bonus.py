from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select

from brace_backend.domain.bonus import BonusLedger
from brace_backend.repositories.base import SQLAlchemyRepository


class BonusLedgerRepository(SQLAlchemyRepository[BonusLedger]):
    model = BonusLedger

    async def list_for_user(
        self, *, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[BonusLedger]:
        stmt = (
            select(BonusLedger)
            .where(BonusLedger.user_id == user_id)
            .order_by(BonusLedger.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.session.scalars(stmt)
        return result.unique().all()

    async def list_available_credits(
        self, *, user_id: UUID, now: datetime
    ) -> list[tuple[BonusLedger, int]]:
        used_subq = (
            select(
                BonusLedger.related_entry_id.label("credit_id"),
                func.coalesce(func.sum(BonusLedger.amount), 0).label("used_amount"),
            )
            .where(BonusLedger.related_entry_id.is_not(None))
            .where(BonusLedger.entry_type.in_(("debit", "expire", "reversal")))
            .group_by(BonusLedger.related_entry_id)
            .subquery()
        )
        remaining = (BonusLedger.amount - func.coalesce(used_subq.c.used_amount, 0)).label(
            "remaining_amount"
        )
        stmt = (
            select(BonusLedger, remaining)
            .outerjoin(used_subq, used_subq.c.credit_id == BonusLedger.id)
            .where(BonusLedger.user_id == user_id)
            .where(BonusLedger.entry_type == "credit")
            .where(BonusLedger.expires_at.is_not(None))
            .where(BonusLedger.expires_at > now)
            .order_by(BonusLedger.expires_at.asc(), BonusLedger.created_at.asc())
        )
        rows = (await self.session.execute(stmt)).all()
        return [(row[0], int(row[1])) for row in rows]

    async def sum_available_balance(self, *, user_id: UUID, now: datetime) -> int:
        used_subq = (
            select(
                BonusLedger.related_entry_id.label("credit_id"),
                func.coalesce(func.sum(BonusLedger.amount), 0).label("used_amount"),
            )
            .where(BonusLedger.related_entry_id.is_not(None))
            .where(BonusLedger.entry_type.in_(("debit", "expire", "reversal")))
            .group_by(BonusLedger.related_entry_id)
            .subquery()
        )
        remaining = BonusLedger.amount - func.coalesce(used_subq.c.used_amount, 0)
        stmt = (
            select(func.coalesce(func.sum(remaining), 0))
            .select_from(BonusLedger)
            .outerjoin(used_subq, used_subq.c.credit_id == BonusLedger.id)
            .where(BonusLedger.user_id == user_id)
            .where(BonusLedger.entry_type == "credit")
            .where(BonusLedger.expires_at.is_not(None))
            .where(BonusLedger.expires_at > now)
        )
        result = await self.session.scalar(stmt)
        return int(result or 0)

    async def sum_orphan_debits(self, *, user_id: UUID) -> int:
        stmt = (
            select(func.coalesce(func.sum(BonusLedger.amount), 0))
            .where(BonusLedger.user_id == user_id)
            .where(BonusLedger.related_entry_id.is_(None))
            .where(BonusLedger.entry_type.in_(("debit", "reversal")))
        )
        result = await self.session.scalar(stmt)
        return int(result or 0)


__all__ = ["BonusLedgerRepository"]
