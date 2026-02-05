from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SupportMessageCreate(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SupportMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticket_id: UUID
    sender: str
    text: str
    meta: dict | None = None
    created_at: datetime
    updated_at: datetime


__all__ = ["SupportMessageCreate", "SupportMessageRead"]
