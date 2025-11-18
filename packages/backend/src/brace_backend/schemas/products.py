from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductVariant(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    size: str
    price_minor_units: int
    stock: int


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: str | None = None
    hero_media_url: str | None = None
    created_at: datetime
    updated_at: datetime
    variants: list[ProductVariant] = Field(default_factory=list)


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    hero_media_url: str | None = None
