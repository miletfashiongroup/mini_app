from __future__ import annotations

import asyncio
import hashlib
from datetime import datetime
from typing import Optional

import httpx

from brace_backend.core.config import settings
from brace_backend.core.logging import logger

_CLIENT = httpx.AsyncClient(timeout=3.0)
BASE_URL = "https://bracefashion.online"


def _cid_from_ids(anon_id: str | None, device_id: str | None, user_id: str | None) -> str:
    raw = anon_id or device_id or user_id or "anon"
    digest = hashlib.sha256(raw.encode()).hexdigest()
    numeric = str(int(digest, 16))
    return numeric[:16]


def _norm_screen(screen: str | None) -> str:
    if not screen:
        return "/"
    if screen.startswith("http://") or screen.startswith("https://"):
        return screen
    if not screen.startswith("/"):
        return "/" + screen
    return screen


async def _call_collect(params: dict[str, object]) -> None:
    try:
        resp = await _CLIENT.get("https://mc.yandex.ru/collect", params=params)
        if resp.status_code != 200:
            logger.warning("metrika_event_failed", status=resp.status_code, params=params)
    except Exception:
        logger.exception("metrika_event_exception", params=params)


async def send_event(
    *,
    counter_id: int,
    measurement_token: str,
    event_name: str,
    occurred_at: datetime,
    client_id: str,
    user_id: Optional[str],
    document_location: str = BASE_URL,
    document_referrer: str = BASE_URL,
) -> None:
    params = {
        "tid": counter_id,
        "cid": client_id,
        "t": "event",
        "ea": event_name,
        "dl": document_location,
        "dr": document_referrer,
        "et": int(occurred_at.timestamp()),
        "ms": measurement_token,
    }
    if user_id:
        params["uid"] = user_id
    await _call_collect(params)


async def send_pageview(
    *,
    counter_id: int,
    measurement_token: str,
    occurred_at: datetime,
    client_id: str,
    user_id: Optional[str],
    screen: str | None,
    referrer: str | None = None,
) -> None:
    path = _norm_screen(screen)
    dl = path if path.startswith("http") else f"{BASE_URL}{path}"
    params = {
        "tid": counter_id,
        "cid": client_id,
        "t": "pageview",
        "dl": dl,
        "dr": referrer or BASE_URL,
        "et": int(occurred_at.timestamp()),
        "ms": measurement_token,
    }
    if user_id:
        params["uid"] = user_id
    await _call_collect(params)


def enqueue_events(
    *,
    events: list[tuple[str, datetime, str | None]],
    client_id_raw: str | None,
    device_id_raw: str | None,
    user_id: Optional[str],
) -> None:
    if not settings.metrika_enabled:
        return
    counter_id = settings.metrika_counter_id
    token = settings.metrika_measurement_token
    if not counter_id or not token:
        return
    client_id = _cid_from_ids(client_id_raw, device_id_raw, user_id)

    for name, occurred_at, screen in events:
        if name == "screen_view":
            asyncio.create_task(
                send_pageview(
                    counter_id=counter_id,
                    measurement_token=token,
                    occurred_at=occurred_at,
                    client_id=client_id,
                    user_id=user_id,
                    screen=screen,
                )
            )
        asyncio.create_task(
            send_event(
                counter_id=counter_id,
                measurement_token=token,
                event_name=name,
                occurred_at=occurred_at,
                client_id=client_id,
                user_id=user_id,
            )
        )
