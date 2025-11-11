from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class Pagination(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class ProductBase(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    hero_media_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProductVariant(BaseModel):
    id: UUID
    size: str
    price: float
    stock: int


class Product(ProductBase):
    variants: list[ProductVariant]


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    hero_media_url: str | None = None


class CartItem(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    size: str
    quantity: int
    unit_price: float
    hero_media_url: str | None = None


class CartItemCreate(BaseModel):
    product_id: UUID
    size: str
    quantity: int = Field(default=1, ge=1, le=10)


class UserProfile(BaseModel):
    id: UUID
    telegram_id: int
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    language_code: str | None = None


class OrderItem(BaseModel):
    id: UUID
    product_id: UUID
    size: str
    quantity: int
    unit_price: float


class Order(BaseModel):
    id: UUID
    status: str
    total_amount: float
    created_at: datetime
    items: list[OrderItem]


class OrderCreate(BaseModel):
    shipping_address: str | None = None
    note: str | None = None


class InitDataPayload(BaseModel):
    init_data: str
