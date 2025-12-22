from collections.abc import AsyncIterator

from fastapi import Depends, Header, Query

from brace_backend.core.exceptions import AccessDeniedError
from brace_backend.core.logging import logger
from brace_backend.core.security import TelegramInitData, validate_request
from brace_backend.db.session import session_manager
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.user import User
from brace_backend.services.user_service import user_service


def _extract_init_data_from_auth(auth_header: str | None) -> str | None:
    if not auth_header:
        return None
    parts = auth_header.split(" ", 1)
    if len(parts) != 2:
        return None
    scheme, token = parts[0].strip().lower(), parts[1].strip()
    if scheme != "tma" or not token:
        return None
    return token


async def get_current_init_data(
    init_data_header: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
    init_data_header_alt: str | None = Header(default=None, alias="X-Telegram-WebApp-Data"),
    auth_header: str | None = Header(default=None, alias="Authorization"),
    init_data_query: str | None = Query(default=None, alias="tgWebAppData"),
    init_data_query_alt: str | None = Query(default=None, alias="initData"),
) -> TelegramInitData:
    init_data = (
        _extract_init_data_from_auth(auth_header)
        or init_data_header
        or init_data_header_alt
        or init_data_query
        or init_data_query_alt
    )
    try:
        return await validate_request(init_data)
    except AccessDeniedError as exc:
        logger.warning(
            "Rejected Telegram init data.",
            reason=str(exc),
            has_init_data=bool(init_data),
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


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if (user.role or "").lower() != "admin":
        raise AccessDeniedError("Admin privileges required.")
    return user
