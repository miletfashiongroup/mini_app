from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.api.deps import get_current_init_data, get_db
from brace_backend.core.security import TelegramInitData
from brace_backend.schemas.common import UserProfile
from brace_backend.services.user_service import upsert_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_me(
    init_data: TelegramInitData = Depends(get_current_init_data),
    session: AsyncSession = Depends(get_db),
) -> UserProfile:
    user = await upsert_user(session, init_data)
    return UserProfile(
        id=user.id,
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        last_name=user.last_name,
        username=user.username,
        language_code=user.language_code,
    )
