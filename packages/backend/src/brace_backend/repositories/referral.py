from __future__ import annotations

from uuid import UUID

from sqlalchemy import select

from brace_backend.domain.referral import ReferralBinding, ReferralCode
from brace_backend.repositories.base import SQLAlchemyRepository


class ReferralCodeRepository(SQLAlchemyRepository[ReferralCode]):
    model = ReferralCode

    async def get_by_code(self, code: str) -> ReferralCode | None:
        stmt = select(ReferralCode).where(ReferralCode.code == code)
        return await self.session.scalar(stmt)

    async def get_for_owner(self, owner_user_id: UUID) -> ReferralCode | None:
        stmt = select(ReferralCode).where(ReferralCode.owner_user_id == owner_user_id)
        return await self.session.scalar(stmt)


class ReferralBindingRepository(SQLAlchemyRepository[ReferralBinding]):
    model = ReferralBinding

    async def get_for_referee(self, referee_user_id: UUID) -> ReferralBinding | None:
        stmt = select(ReferralBinding).where(ReferralBinding.referee_user_id == referee_user_id)
        return await self.session.scalar(stmt)

    async def get_pending_for_referee_for_update(
        self, referee_user_id: UUID
    ) -> ReferralBinding | None:
        stmt = (
            select(ReferralBinding)
            .where(ReferralBinding.referee_user_id == referee_user_id)
            .where(ReferralBinding.status == "pending")
            .with_for_update()
        )
        return await self.session.scalar(stmt)

    async def list_for_referrer(self, referrer_user_id: UUID) -> list[ReferralBinding]:
        stmt = (
            select(ReferralBinding)
            .where(ReferralBinding.referrer_user_id == referrer_user_id)
            .order_by(ReferralBinding.created_at.desc())
        )
        result = await self.session.scalars(stmt)
        return result.unique().all()


__all__ = ["ReferralCodeRepository", "ReferralBindingRepository"]
