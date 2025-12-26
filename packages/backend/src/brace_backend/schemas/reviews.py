from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ProductReviewMediaRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    url: str
    sort_order: int
    created_at: datetime


class ProductReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    rating: int
    text: str
    is_anonymous: bool
    status: str
    created_at: datetime
    updated_at: datetime
    author_name: str
    helpful_count: int = 0
    not_helpful_count: int = 0
    size_label: str | None = None
    purchase_date: datetime | None = None
    media: list[ProductReviewMediaRead] = Field(default_factory=list)
