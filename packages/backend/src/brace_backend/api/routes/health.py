from fastapi import APIRouter
from sqlalchemy import text

from brace_backend.db.session import session_manager
from brace_backend.schemas.common import SuccessResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=SuccessResponse[dict[str, str]])
async def healthcheck() -> SuccessResponse[dict[str, str]]:
    async with session_manager.session() as session:
        await session.execute(text("SELECT 1"))
    return SuccessResponse(data={"status": "ok", "database": "connected"})
