from fastapi import APIRouter, Depends

from brace_backend.api.deps import get_uow
from brace_backend.db.uow import UnitOfWork
from brace_backend.schemas.common import SuccessResponse
from brace_backend.schemas.main_screen import (
    BannerListResponse,
    SizeCalculationRequest,
    SizeCalculationResponse,
)
from brace_backend.services.banner_service import banner_service
from brace_backend.services.size_service import size_service

router = APIRouter(tags=["Main Screen"])


@router.get("/banners", response_model=SuccessResponse[BannerListResponse])
async def list_banners(uow: UnitOfWork = Depends(get_uow)) -> SuccessResponse[BannerListResponse]:
    payload = await banner_service.list_banners(uow)
    return SuccessResponse[BannerListResponse](data=payload)


@router.post("/size/calc", response_model=SuccessResponse[SizeCalculationResponse])
async def calculate_size(
    payload: SizeCalculationRequest,
) -> SuccessResponse[SizeCalculationResponse]:
    result = size_service.calculate(payload)
    return SuccessResponse[SizeCalculationResponse](data=result)


__all__ = ["router"]
