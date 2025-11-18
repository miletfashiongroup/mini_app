from collections.abc import AsyncIterator
import logging

from fastapi import Depends, Header

from brace_backend.core.exceptions import AccessDeniedError
from brace_backend.core.security import TelegramInitData, validate_request
from brace_backend.db.session import session_manager
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.services.user_service import user_service


logger = logging.getLogger(__name__)


async def get_current_init_data(
    init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data")
) -> TelegramInitData:
    try:
        return await validate_request(init_data)
    except AccessDeniedError as exc:
        logger.warning(
            "Rejected Telegram init data.",
            extra={"reason": str(exc), "has_init_data": bool(init_data)},
        )
        raise


async def get_uow() -> AsyncIterator[UnitOfWork]:
    async with session_manager.session() as session:
        yield UnitOfWork(session)


async def get_current_user(
    init_data: TelegramInitData = Depends(get_current_init_data),
    uow: UnitOfWork = Depends(get_uow),
) -> User:
    return await user_service.sync_from_telegram(uow, init_data)
