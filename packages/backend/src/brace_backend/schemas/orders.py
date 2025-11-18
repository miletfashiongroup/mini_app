from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    size: str
    quantity: int
    unit_price_minor_units: int


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    total_minor_units: int
    shipping_address: str | None = None
    note: str | None = None
    created_at: datetime
    items: list[OrderItemRead]


class OrderCreate(BaseModel):
    shipping_address: str | None = Field(default=None, max_length=512)  # PRINCIPAL-FIX
    note: str | None = None
