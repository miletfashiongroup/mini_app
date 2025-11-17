from fastapi import APIRouter, Depends

from brace_backend.api.deps import get_current_init_data
from brace_backend.core.security import TelegramInitData
from brace_backend.schemas.common import SuccessResponse

router = APIRouter(prefix="/verify-init", tags=["Telegram"])


@router.post("", response_model=SuccessResponse[dict[str, str]])
async def verify_init(
    init_data: TelegramInitData = Depends(get_current_init_data),
) -> SuccessResponse[dict[str, str]]:
    return SuccessResponse(
        data={"status": "verified", "telegram_id": str(init_data.user.get("id"))}
    )
