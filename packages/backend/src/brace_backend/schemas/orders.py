from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    size: str
    quantity: int
    unit_price: str


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    total_amount: str
    shipping_address: str | None = None
    note: str | None = None
    created_at: datetime
    items: list[OrderItemRead]


class OrderCreate(BaseModel):
    shipping_address: str | None = None
    note: str | None = None
