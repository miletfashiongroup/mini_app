from __future__ import annotations

import random
import string
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import text

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.limiter import limiter
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.common import SuccessResponse

router = APIRouter(prefix="/referrals", tags=["Referrals"])


class ReferralApplyRequest(BaseModel):
    code: str


class ReferralBindingRead(BaseModel):
    id: UUID
    referrer_user_id: UUID
    referee_user_id: UUID
    status: str
    code: str
    created_at: datetime


class ReferralInviteRead(BaseModel):
    referrer_user_id: UUID
    referee_user_id: UUID
    status: str
    created_at: datetime


class ReferralMyResponse(BaseModel):
    code: str
    is_active: bool
    invited: list[ReferralInviteRead]


def _to_uuid(value) -> UUID:
    if isinstance(value, UUID):
        return value
    return UUID(str(value))


def _generate_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choices(alphabet, k=length))


async def _get_or_create_code(uow: UnitOfWork, user_id: UUID) -> tuple[UUID, str, bool]:
    row = (
        await uow.session.execute(
            text("SELECT id, code, is_active FROM referral_code WHERE owner_user_id = :uid"),
            {"uid": str(user_id)},
        )
    ).first()
    if row:
        code_id = _to_uuid(row.id)
        return code_id, row.code, row.is_active

    code = _generate_code()
    code_id = uuid4()
    await uow.session.execute(
        text(
            """
            INSERT INTO referral_code (id, owner_user_id, code, is_active)
            VALUES (:id, :uid, :code, true)
            """
        ),
        {"id": str(code_id), "uid": str(user_id), "code": code},
    )
    await uow.commit()
    return code_id, code, True


@router.post("/apply", response_model=SuccessResponse[ReferralBindingRead], status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def apply_referral_code(
    request: Request,
    payload: ReferralApplyRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[ReferralBindingRead]:
    code_value = payload.code.strip().upper()
    if not code_value:
        raise HTTPException(status_code=400, detail="Код не может быть пустым")

    code_row = (
        await uow.session.execute(
            text("SELECT id, owner_user_id, is_active FROM referral_code WHERE code = :code"),
            {"code": code_value},
        )
    ).first()
    if not code_row:
        raise HTTPException(status_code=404, detail="Код не найден")
    owner_id = _to_uuid(code_row.owner_user_id)
    if owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя использовать свой код")

    existing = (
        await uow.session.execute(
            text(
                """
                SELECT id, referrer_user_id, referee_user_id, status, created_at
                FROM referral_binding
                WHERE referee_user_id = :uid
                """
            ),
            {"uid": str(current_user.id)},
        )
    ).first()
    if existing:
        return SuccessResponse[ReferralBindingRead](
            data=ReferralBindingRead(
                id=_to_uuid(existing.id),
                referrer_user_id=_to_uuid(existing.referrer_user_id),
                referee_user_id=_to_uuid(existing.referee_user_id),
                status=existing.status,
                code=code_value,
                created_at=existing.created_at,
            )
        )

    binding_id = uuid4()
    await uow.session.execute(
        text(
            """
            INSERT INTO referral_binding (id, referrer_user_id, referee_user_id, code_id, status)
            VALUES (:id, :referrer, :referee, :code_id, pending)
            """
        ),
        {
            "id": str(binding_id),
            "referrer": str(owner_id),
            "referee": str(current_user.id),
            "code_id": str(code_row.id),
        },
    )
    await uow.commit()

    return SuccessResponse[ReferralBindingRead](
        data=ReferralBindingRead(
            id=binding_id,
            referrer_user_id=owner_id,
            referee_user_id=current_user.id,
            status="pending",
            code=code_value,
            created_at=datetime.utcnow(),
        )
    )


@router.get("/my", response_model=SuccessResponse[ReferralMyResponse])
@limiter.limit("30/minute")
async def get_my_referral(
    request: Request,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[ReferralMyResponse]:
    _, code_value, is_active = await _get_or_create_code(uow, user_id=current_user.id)

    invited_rows = (
        await uow.session.execute(
            text(
                """
                SELECT referrer_user_id, referee_user_id, status, created_at
                FROM referral_binding
                WHERE referrer_user_id = :uid
                ORDER BY created_at DESC
                """
            ),
            {"uid": str(current_user.id)},
        )
    ).all()

    invited = [
        ReferralInviteRead(
            referrer_user_id=_to_uuid(row.referrer_user_id),
            referee_user_id=_to_uuid(row.referee_user_id),
            status=row.status,
            created_at=row.created_at,
        )
        for row in invited_rows
    ]

    return SuccessResponse[ReferralMyResponse](
        data=ReferralMyResponse(code=code_value, is_active=is_active, invited=invited)
    )


__all__ = ["router"]
