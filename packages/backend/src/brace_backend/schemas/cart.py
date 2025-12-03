from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CartItemCreate(BaseModel):
    product_id: UUID
    size: str = Field(min_length=1, max_length=10)  # PRINCIPAL-FIX: align with product_variants.size
    quantity: int = Field(default=1, ge=1, le=10)


class CartItemUpdate(BaseModel):
    quantity: int = Field(default=1, ge=1, le=10)


class CartItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    product_name: str
    size: str = Field(min_length=1, max_length=25)
    quantity: int
    unit_price_minor_units: int
    hero_media_url: str | None = None
    stock_left: int | None = None


class CartCollection(BaseModel):
    items: list[CartItemRead]
    total_minor_units: int
