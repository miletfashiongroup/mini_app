from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    product_name: str | None = None
    product_code: str | None = None
    hero_media_url: str | None = None
    size: str
    quantity: int
    unit_price_minor_units: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    total_minor_units: int
    bonus_applied_minor_units: int = 0
    payable_minor_units: int = 0
    shipping_address: str | None = None
    note: str | None = None
    created_at: datetime
    items: list[OrderItemRead]


class OrderCreate(BaseModel):
    address: str | None = Field(default=None, max_length=512)
    delivery_type: str | None = Field(default=None, max_length=32)
    comment: str | None = Field(default=None, max_length=512)
    shipping_address: str | None = Field(default=None, max_length=512)  # legacy
    note: str | None = None  # legacy
    bonus_minor_units: int | None = Field(default=None, ge=0)
