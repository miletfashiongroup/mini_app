from fastapi import APIRouter

from brace_backend.schemas.common import SuccessResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=SuccessResponse[dict[str, str]])
async def healthcheck() -> SuccessResponse[dict[str, str]]:
    return SuccessResponse(data={"status": "ok"})
