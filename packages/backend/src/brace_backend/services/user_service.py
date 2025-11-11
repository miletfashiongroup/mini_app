from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from brace_backend.core.security import TelegramInitData
from brace_backend.models import User


async def upsert_user(session: AsyncSession, init_data: TelegramInitData) -> User:
    user_payload = init_data.user
    telegram_id = user_payload.get("id")

    stmt = select(User).where(User.telegram_id == telegram_id)
    existing = await session.scalar(stmt)
    if existing:
        existing.first_name = user_payload.get("first_name")
        existing.last_name = user_payload.get("last_name")
        existing.username = user_payload.get("username")
        existing.language_code = user_payload.get("language_code")
        await session.commit()
        await session.refresh(existing)
        return existing

    user = User(
        telegram_id=telegram_id,
        first_name=user_payload.get("first_name"),
        last_name=user_payload.get("last_name"),
        username=user_payload.get("username"),
        language_code=user_payload.get("language_code"),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
