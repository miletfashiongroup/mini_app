from fastapi import APIRouter, Depends, Header, Request

from brace_backend.core.config import settings
from brace_backend.core.exceptions import AccessDeniedError
from brace_backend.api.deps import get_uow
from brace_backend.db.uow import UnitOfWork
from brace_backend.services.telegram_bot import telegram_bot_service

router = APIRouter(prefix="/telegram", tags=["Telegram Bot"])


@router.post("/webhook")
async def webhook(
    request: Request,
    uow: UnitOfWork = Depends(get_uow),
    secret_token: str | None = Header(default=None, alias="X-Telegram-Bot-Api-Secret-Token"),
) -> dict[str, str]:
    expected = getattr(settings, "telegram_webhook_secret", None)
    if expected and secret_token != expected:
        raise AccessDeniedError("Telegram webhook secret mismatch.")
    payload = await request.json()
    await telegram_bot_service.handle_update(uow, payload)
    return {"status": "ok"}
