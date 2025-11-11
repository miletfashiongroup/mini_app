from fastapi import APIRouter, Depends

from brace_backend.api.deps import get_current_init_data
from brace_backend.core.security import TelegramInitData

router = APIRouter(prefix="/verify-init", tags=["Telegram"])


@router.post("")
async def verify_init(init_data: TelegramInitData = Depends(get_current_init_data)) -> dict[str, str]:
    return {"status": "verified", "telegram_id": str(init_data.user.get("id"))}
