from __future__ import annotations

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy import case, func, select

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.limiter import limiter
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.bonus import BonusLedger
from brace_backend.domain.user import User
from brace_backend.schemas.common import SuccessResponse

router = APIRouter(prefix="/bonus", tags=["Bonus"])


class BonusBalance(BaseModel):
    balance: int


class BonusLedgerEntryRead(BaseModel):
    id: UUID
    created_at: datetime
    amount: int
    type: str
    reason: str | None = None
    expires_at: datetime | None = None


@router.get("/balance", response_model=SuccessResponse[BonusBalance])
@limiter.limit("30/minute")
async def get_bonus_balance(
    request: Request,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[BonusBalance]:
    stmt = (
        select(
            func.coalesce(
                func.sum(
                    case(
                        (BonusLedger.entry_type == "credit", BonusLedger.amount),
                        else_=-BonusLedger.amount,
                    )
                ),
                0,
            )
        )
        .where(BonusLedger.user_id == current_user.id)
    )
    result = await uow.session.execute(stmt)
    balance = result.scalar_one()
    visible_balance = max(0, balance)
    return SuccessResponse[BonusBalance](data=BonusBalance(balance=visible_balance))


@router.get("/ledger", response_model=SuccessResponse[List[BonusLedgerEntryRead]])
@limiter.limit("30/minute")
async def get_bonus_ledger(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[List[BonusLedgerEntryRead]]:
    stmt = (
        select(BonusLedger)
        .where(BonusLedger.user_id == current_user.id)
        .order_by(BonusLedger.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await uow.session.scalars(stmt)
    entries: List[BonusLedgerEntryRead] = []
    for entry in result:
        entries.append(
            BonusLedgerEntryRead(
                id=entry.id,
                created_at=entry.created_at,
                amount=entry.amount,
                type=entry.entry_type,
                reason=entry.reason,
                expires_at=entry.expires_at,
            )
        )
    return SuccessResponse[List[BonusLedgerEntryRead]](data=entries)


__all__ = ["router"]
