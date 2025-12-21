from fastapi import APIRouter, Depends, Request

from brace_backend.api.deps import get_current_user, get_uow
from brace_backend.core.exceptions import ValidationError
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.schemas.common import SuccessResponse
from brace_backend.schemas.users import UserConsentRequest, UserProfile, UserProfileUpdate
from brace_backend.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["Users"])


def _resolve_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


@router.get("/me", response_model=SuccessResponse[UserProfile])
async def get_me(current_user: User = Depends(get_current_user)) -> SuccessResponse[UserProfile]:
    profile = UserProfile.model_validate(current_user)
    return SuccessResponse[UserProfile](data=profile)


@router.post("/me/consent", response_model=SuccessResponse[UserProfile])
async def record_consent(
    request: Request,
    payload: UserConsentRequest,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[UserProfile]:
    if not payload.consent:
        raise ValidationError("Consent is required to continue.")
    client_ip = _resolve_client_ip(request)
    user_agent = request.headers.get("user-agent")
    user = await user_service.record_consent(
        uow,
        current_user,
        consent_text=payload.consent_text or "",
        client_ip=client_ip,
        user_agent=user_agent,
    )
    return SuccessResponse[UserProfile](data=UserProfile.model_validate(user))


@router.put("/me/profile", response_model=SuccessResponse[UserProfile])
async def update_profile(
    request: Request,
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> SuccessResponse[UserProfile]:
    user = await user_service.update_profile(
        uow,
        current_user,
        payload=payload,
        client_ip=_resolve_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return SuccessResponse[UserProfile](data=UserProfile.model_validate(user))
