from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class BannerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    image_url: str | None = None
    video_url: str | None = None
    is_active: bool
    sort_order: int


class BannerListResponse(BaseModel):
    banners: list[BannerRead] = Field(default_factory=list)
    active_index: int = Field(ge=0)


class SizeCalculationRequest(BaseModel):
    waist: float = Field(gt=0)
    hip: float = Field(gt=0)


class SizeCalculationResponse(BaseModel):
    size: str


__all__ = [
    "BannerRead",
    "BannerListResponse",
    "SizeCalculationRequest",
    "SizeCalculationResponse",
]
