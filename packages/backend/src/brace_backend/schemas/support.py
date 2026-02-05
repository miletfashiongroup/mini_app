from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SupportTicketCreate(BaseModel):
    subject: str = Field(min_length=1, max_length=128)
    message: str = Field(min_length=1)
    order_id: UUID | None = None
    priority: str | None = Field(default="normal")
    contact: str | None = Field(default=None, max_length=128)
    category: str | None = Field(default=None, max_length=64)


class SupportTicketStatusUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=16)


class SupportTicketRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    order_id: UUID | None = None
    status: str
    priority: str
    subject: str
    message: str
    manager_comment: str | None = None
    meta: dict | None = None
    created_at: datetime
    updated_at: datetime


class BonusAdjustmentRequest(BaseModel):
    user_id: UUID
    amount: int = Field(gt=0)
    reason: str = Field(default="manual_adjustment", max_length=32)
    order_id: UUID | None = None
    ticket_id: UUID | None = None


__all__ = [
    "SupportTicketCreate",
    "SupportTicketStatusUpdate",
    "SupportTicketRead",
    "BonusAdjustmentRequest",
]
