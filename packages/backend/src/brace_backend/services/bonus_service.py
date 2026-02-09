from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from brace_backend.core.config import settings
from brace_backend.core.exceptions import ValidationError
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.bonus import BonusLedger


def _utc_now() -> datetime:
    return datetime.now(tz=timezone.utc)


class BonusService:
    async def credit(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        amount: int,
        order_id: UUID | None = None,
        reason: str,
        commit: bool = True,
    ) -> BonusLedger:
        if amount <= 0:
            raise ValidationError("Bonus amount must be positive.")
        expires_at = _utc_now() + timedelta(days=settings.bonus_expiration_days)
        entry = BonusLedger(
            user_id=user_id,
            order_id=order_id,
            entry_type="credit",
            amount=amount,
            reason=reason,
            expires_at=expires_at,
        )
        await uow.bonus_ledger.add(entry)
        if commit:
            await uow.commit()
            await uow.session.refresh(entry)
        return entry

    async def debit(
        self,
        uow: UnitOfWork,
        *,
        user_id: UUID,
        amount: int,
        order_id: UUID | None = None,
        reason: str,
        allow_negative: bool = False,
        commit: bool = True,
    ) -> list[BonusLedger]:
        if amount <= 0:
            raise ValidationError("Bonus amount must be positive.")
        now = _utc_now()
        credits = await uow.bonus_ledger.list_available_credits(user_id=user_id, now=now)
        remaining = amount
        entries: list[BonusLedger] = []

        for credit, credit_remaining in credits:
            if remaining <= 0:
                break
            if credit_remaining <= 0:
                continue
            use_amount = min(credit_remaining, remaining)
            entry = BonusLedger(
                user_id=user_id,
                order_id=order_id,
                entry_type="debit",
                amount=use_amount,
                reason=reason,
                related_entry_id=credit.id,
            )
            entries.append(entry)
            remaining -= use_amount

        if remaining > 0:
            if not allow_negative:
                raise ValidationError("Insufficient bonus balance.")
            entry = BonusLedger(
                user_id=user_id,
                order_id=order_id,
                entry_type="reversal",
                amount=remaining,
                reason=reason,
            )
            entries.append(entry)
            remaining = 0

        for entry in entries:
            await uow.bonus_ledger.add(entry)
        if commit:
            await uow.commit()
            for entry in entries:
                await uow.session.refresh(entry)
        return entries

    async def balance(self, uow: UnitOfWork, *, user_id: UUID) -> int:
        now = _utc_now()
        credits = await uow.bonus_ledger.sum_available_balance(user_id=user_id, now=now)
        orphan_debits = await uow.bonus_ledger.sum_orphan_debits(user_id=user_id)
        return int(credits - orphan_debits)

    async def ledger(
        self, uow: UnitOfWork, *, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[BonusLedger]:
        return await uow.bonus_ledger.list_for_user(user_id=user_id, limit=limit, offset=offset)


bonus_service = BonusService()

__all__ = ["bonus_service", "BonusService"]
