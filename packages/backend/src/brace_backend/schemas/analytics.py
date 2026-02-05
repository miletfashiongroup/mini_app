from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ALLOWED_EVENT_NAMES = {
    "app_open",
    "screen_view",
    "catalog_view",
    "catalog_tab_change",
    "product_view",
    "size_selected",
    "add_to_cart",
    "cart_view",
    "cart_item_remove",
    "cart_quantity_change",
    "checkout_start",
    "order_created",
    "order_failed",
    "search_used",
    "filter_applied",
    "order_status_changed",
    "support_message_sent",
}

MAX_EVENT_PROPERTIES = 50
MAX_STRING_LENGTH = 256
MAX_EVENT_NAME_LENGTH = 64


def _validate_properties(properties: dict[str, Any] | None) -> dict[str, Any] | None:
    if properties is None:
        return None
    if len(properties) > MAX_EVENT_PROPERTIES:
        raise ValueError("Too many properties in event payload.")
    for key, value in properties.items():
        if len(str(key)) > 64:
            raise ValueError("Property key is too long.")
        if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
            raise ValueError("Property value is too long.")
    return properties


class AnalyticsEventIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_id: UUID
    name: str = Field(..., max_length=MAX_EVENT_NAME_LENGTH)
    occurred_at: datetime
    version: int = Field(default=1, ge=1, le=99)
    properties: dict[str, Any] | None = None
    screen: str | None = Field(default=None, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if value not in ALLOWED_EVENT_NAMES:
            raise ValueError("Unknown analytics event name.")
        return value

    @field_validator("properties")
    @classmethod
    def validate_properties(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        return _validate_properties(value)


class AnalyticsBatchIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    schema_version: int = Field(default=1, ge=1, le=10)
    session_id: str = Field(..., max_length=64)
    device_id: str | None = Field(default=None, max_length=64)
    anon_id: str | None = Field(default=None, max_length=64)
    context: dict[str, Any] | None = None
    events: list[AnalyticsEventIn]

    @field_validator("context")
    @classmethod
    def validate_context(cls, value: dict[str, Any] | None) -> dict[str, Any] | None:
        return _validate_properties(value)

    @model_validator(mode="after")
    def validate_events(self) -> "AnalyticsBatchIn":
        if not self.events:
            raise ValueError("Analytics batch is empty.")
        return self


class AnalyticsIngestResponse(BaseModel):
    ingested: int
    deduped: int


AnalyticsEventIn.model_rebuild()
AnalyticsBatchIn.model_rebuild()
