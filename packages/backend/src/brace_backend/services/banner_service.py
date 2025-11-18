from __future__ import annotations

from brace_backend.db.uow import UnitOfWork
from brace_backend.schemas.main_screen import BannerListResponse, BannerRead


class BannerService:
    async def list_banners(self, uow: UnitOfWork) -> BannerListResponse:
        banners = await uow.banners.list_ordered()
        schema_items = [BannerRead.model_validate(banner) for banner in banners]
        active_index = 0
        for idx, banner in enumerate(banners):
            if banner.is_active:
                active_index = idx
                break
        return BannerListResponse(banners=schema_items, active_index=active_index)


banner_service = BannerService()

__all__ = ["banner_service", "BannerService"]
