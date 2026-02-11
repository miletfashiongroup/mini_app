from __future__ import annotations

import random
import string
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, Body, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import text

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.exceptions import ValidationError, ConflictError
from brace_backend.core.limiter import limiter
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.common import SuccessResponse
from brace_backend.services.referral_service import referral_service

router = APIRouter(prefix="/referrals", tags=["Referrals"])


class ReferralApplyRequest(BaseModel):
    code: str | None = None


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
    payload: ReferralApplyRequest | None = Body(default=None),
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[ReferralBindingRead]:
    # Accept code from JSON body, query param or form; be lenient to avoid 422
    code_value = (payload.code if payload else None) or request.query_params.get("code") or ""
    if not code_value:
        try:
            data = await request.json()
            code_value = str(data.get("code", ""))
        except Exception:
            try:
                form = await request.form()
                code_value = str(form.get("code", ""))
            except Exception:
                code_value = ""
    code_value = code_value.strip().upper()
    if not code_value:
        raise HTTPException(status_code=400, detail="Код не может быть пустым")

    try:
        binding = await referral_service.apply_referral_code(uow, user_id=current_user.id, code=code_value)
    except ConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return SuccessResponse[ReferralBindingRead](
        data=ReferralBindingRead(
            id=binding.id,
            referrer_user_id=binding.referrer_user_id,
            referee_user_id=binding.referee_user_id,
            status=binding.status,
            code=code_value,
            created_at=binding.created_at,
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
