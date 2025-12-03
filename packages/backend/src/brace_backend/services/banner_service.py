from __future__ import annotations

import time

from brace_backend.core.config import settings
from brace_backend.db.uow import UnitOfWork
from brace_backend.schemas.main_screen import BannerListResponse, BannerRead


class BannerService:
    def __init__(self) -> None:
        self._cache: BannerListResponse | None = None
        self._cache_ttl_seconds = 60
        self._cache_expires_at: float = 0.0

    async def list_banners(self, uow: UnitOfWork) -> BannerListResponse:
        now = time.time()
        if settings.environment.lower() != "production":
            self._cache = None  # avoid stale data during tests/local dev
        if self._cache and now < self._cache_expires_at:
            return self._cache
        banners = await uow.banners.list_ordered()
        schema_items = [BannerRead.model_validate(banner) for banner in banners]
        active_index = 0
        for idx, banner in enumerate(banners):
            if banner.is_active:
                # Client widgets expect 1-based index for the active slide
                active_index = idx + 1
                break
        payload = BannerListResponse(banners=schema_items, active_index=active_index)
        self._cache = payload
        self._cache_expires_at = now + self._cache_ttl_seconds
        return payload


banner_service = BannerService()

__all__ = ["banner_service", "BannerService"]
