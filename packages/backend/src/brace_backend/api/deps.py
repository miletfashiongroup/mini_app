from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.core.security import TelegramInitData, validate_request
from brace_backend.db.session import get_session


async def get_current_init_data(
    init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data")
) -> TelegramInitData:
    return await validate_request(init_data)


async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    return session
