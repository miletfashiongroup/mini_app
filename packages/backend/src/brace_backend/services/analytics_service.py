from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from brace_backend.core.config import settings
from brace_backend.services import metrika_sender
from brace_backend.core.logging import logger
from brace_backend.core.security import TelegramInitData
from brace_backend.db.uow import UnitOfWork
from brace_backend.domain.analytics import AnalyticsEvent
from brace_backend.schemas.analytics import ALLOWED_EVENT_NAMES, AnalyticsBatchIn, AnalyticsEventIn

MAX_SERIALIZED_BYTES = 8_192
EVENT_TIME_DRIFT_SECONDS = 7 * 24 * 60 * 60
REDACT_KEYS = {
    "telegram_id",
    "phone",
    "phone_number",
    "email",
    "address",
    "username",
    "first_name",
    "last_name",
}

EVENT_SCHEMAS: dict[str, dict[str, type]] = {
    "app_open": {"first_open": bool},
    "screen_view": {},
    "catalog_view": {"items_count": int},
    "catalog_tab_change": {"from_category": str, "to_category": str},
    "product_view": {"product_id": str},
    "size_selected": {"product_id": str, "size": str},
    "add_to_cart": {"product_id": str, "size": str, "quantity": int},
    "cart_view": {"cart_items": int},
    "cart_item_remove": {"product_id": str},
    "cart_quantity_change": {"product_id": str, "prev_quantity": int, "next_quantity": int},
    "checkout_start": {"cart_items": int},
    "order_created": {"order_id": str, "order_total_minor_units": int},
    "order_failed": {"error_code": str},
    "search_used": {"query": str},
    "filter_applied": {"filter_name": str},
    "order_status_changed": {"order_id": str, "to_status": str},
    "support_message_sent": {"channel": str},
}


def _hash_value(value: str | None, salt: str) -> str | None:
    if not value:
        return None
    return hmac.new(salt.encode(), value.encode(), hashlib.sha256).hexdigest()


def _sanitize_payload(payload: dict[str, Any] | None) -> dict[str, Any] | None:
    if not payload:
        return payload

    def _sanitize(value: Any) -> Any:
        if isinstance(value, dict):
            cleaned: dict[str, Any] = {}
            for key, item in value.items():
                if key in REDACT_KEYS:
                    continue
                cleaned[key] = _sanitize(item)
            return cleaned
        if isinstance(value, list):
            return [_sanitize(item) for item in value]
        return value

    return _sanitize(payload)


def _ensure_payload_size(payload: dict[str, Any] | None) -> None:
    if payload is None:
        return
    if len(json.dumps(payload, ensure_ascii=True)) > MAX_SERIALIZED_BYTES:
        raise ValueError("Analytics payload слишком большой.")


def _clamp_event_time(value: datetime) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    now = datetime.now(tz=timezone.utc)
    drift = abs((now - value).total_seconds())
    if drift > EVENT_TIME_DRIFT_SECONDS:
        return now
    return value


def _validate_event_schema(event: AnalyticsEventIn) -> None:
    if event.name not in ALLOWED_EVENT_NAMES:
        raise ValueError("Unknown analytics event name.")
    required = EVENT_SCHEMAS.get(event.name, {})
    if not required:
        return
    props = event.properties or {}
    for key, expected_type in required.items():
        if key not in props:
            raise ValueError(f"Missing required property: {key}.")
        if not isinstance(props[key], expected_type):
            raise ValueError(f"Property '{key}' must be {expected_type.__name__}.")


class AnalyticsService:
    async def ingest_batch(
        self,
        uow: UnitOfWork,
        payload: AnalyticsBatchIn,
        init_data: TelegramInitData | None,
        *,
        ip_address: str | None,
        user_agent: str | None,
    ) -> tuple[int, int]:
        if not settings.analytics_enabled:
            return 0, len(payload.events)

        if not init_data and settings.is_production and not settings.analytics_allow_anonymous:
            raise ValueError("Anonymous analytics ingestion is disabled.")

        if len(payload.events) > settings.analytics_max_batch_size:
            raise ValueError("Analytics batch size exceeded.")

        payload_bytes = len(json.dumps(payload.model_dump(mode="json"), ensure_ascii=True))
        if payload_bytes > settings.analytics_max_payload_bytes:
            raise ValueError("Analytics payload превышает лимит размера.")

        salt = settings.analytics_hash_salt
        user_id = None
        if init_data and init_data.user:
            user_id = str(init_data.user.get("id")) if init_data.user.get("id") is not None else None

        user_id_hash = _hash_value(user_id, salt)
        anon_id_hash = _hash_value(payload.anon_id, salt)
        device_id_hash = _hash_value(payload.device_id, salt)
        ip_hash = _hash_value(ip_address, salt)
        user_agent_hash = _hash_value(user_agent, salt)

        sanitized_context = _sanitize_payload(payload.context)
        _ensure_payload_size(sanitized_context)

        events: list[AnalyticsEvent] = []
        for event in payload.events:
            _validate_event_schema(event)
            props = _sanitize_payload(event.properties)
            _ensure_payload_size(props)
            occurred_at = _clamp_event_time(event.occurred_at)
            events.append(
                AnalyticsEvent(
                    event_id=event.event_id,
                    name=event.name,
                    event_version=event.version,
                    schema_version=payload.schema_version,
                    occurred_at=occurred_at,
                    source="client",
                    session_id=payload.session_id,
                    device_id_hash=device_id_hash,
                    anon_id_hash=anon_id_hash,
                    user_id_hash=user_id_hash,
                    screen=event.screen,
                    properties=props,
                    context=sanitized_context,
                    ip_hash=ip_hash,
                    user_agent_hash=user_agent_hash,
                )
            )

        inserted = await uow.analytics.add_events(events)
        await uow.commit()
        deduped = len(events) - inserted
        # Fire-and-forget server-side sending to Yandex Metrika Measurement Protocol
        try:
            metrika_sender.enqueue_events(
                events=[(e.name, _clamp_event_time(e.occurred_at), e.screen) for e in payload.events],
                client_id_raw=payload.anon_id,
                device_id_raw=payload.device_id,
                user_id=str(init_data.user.get("id")) if init_data and init_data.user else None,
            )
        except Exception:
            logger.exception("metrika_enqueue_failed")

        logger.info(
            "analytics_ingested",
            ingested=inserted,
            deduped=deduped,
            events=len(events),
        )
        return inserted, deduped

    async def record_server_event(
        self,
        uow: UnitOfWork,
        *,
        name: str,
        occurred_at: datetime | None,
        user_id: UUID | None,
        properties: dict[str, Any] | None,
    ) -> None:
        if not settings.analytics_enabled:
            return
        if name not in ALLOWED_EVENT_NAMES:
            logger.warning("analytics_server_event_skipped", reason="unknown_name", name=name)
            return
        salt = settings.analytics_hash_salt
        user_id_hash = _hash_value(str(user_id) if user_id else None, salt)
        props = _sanitize_payload(properties)
        _ensure_payload_size(props)
        event = AnalyticsEvent(
            event_id=UUID(bytes=hashlib.sha256(f"{name}:{user_id}:{datetime.utcnow()}".encode()).digest()[:16]),
            name=name,
            event_version=1,
            schema_version=1,
            occurred_at=_clamp_event_time(occurred_at or datetime.now(tz=timezone.utc)),
            source="server",
            session_id=None,
            device_id_hash=None,
            anon_id_hash=None,
            user_id_hash=user_id_hash,
            screen=None,
            properties=props,
            context=None,
            ip_hash=None,
            user_agent_hash=None,
        )
        await uow.analytics.add_events([event])
        await uow.commit()


analytics_service = AnalyticsService()

__all__ = ["analytics_service", "AnalyticsService"]
