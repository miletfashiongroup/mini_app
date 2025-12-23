from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from sqlalchemy import select

from brace_backend.domain.analytics import AnalyticsEvent

pytestmark = pytest.mark.asyncio


def _batch_payload(event_name: str = "app_open"):
    return {
        "schema_version": 1,
        "session_id": "sess-123",
        "device_id": "device-123",
        "anon_id": "anon-123",
        "context": {"app_version": "0.1.0"},
        "events": [
            {
                "event_id": str(uuid4()),
                "name": event_name,
                "occurred_at": datetime.now(tz=timezone.utc).isoformat(),
                "version": 1,
                "properties": {"first_open": True},
                "screen": "/",
            }
        ],
    }


async def test_analytics_ingest_success(api_client):
    client, ctx = api_client
    payload = _batch_payload()

    response = await client.post("/api/analytics/events", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["ingested"] == 1
    assert body["data"]["deduped"] == 0

    async with ctx["session_factory"]() as session:
        stored = await session.scalar(select(AnalyticsEvent).where(AnalyticsEvent.name == "app_open"))
        assert stored is not None


async def test_analytics_ingest_rejects_unknown_event(api_client):
    client, _ = api_client
    payload = _batch_payload(event_name="unknown_event")

    response = await client.post("/api/analytics/events", json=payload)
    assert response.status_code == 422


async def test_analytics_ingest_dedupes(api_client):
    client, _ = api_client
    payload = _batch_payload()
    event_id = payload["events"][0]["event_id"]

    response1 = await client.post("/api/analytics/events", json=payload)
    response2 = await client.post("/api/analytics/events", json=payload)
    assert response1.status_code == 200
    assert response2.status_code == 200
    assert response2.json()["data"]["deduped"] == 1
    assert event_id == payload["events"][0]["event_id"]


async def test_analytics_batch_size_limit(api_client):
    client, _ = api_client
    payload = _batch_payload()
    payload["events"] = payload["events"] * 40
    response = await client.post("/api/analytics/events", json=payload)
    assert response.status_code == 422


async def test_analytics_payload_size_limit(api_client):
    client, _ = api_client
    payload = _batch_payload()
    payload["events"][0]["properties"] = {"first_open": True, "blob": "x" * 70000}
    response = await client.post("/api/analytics/events", json=payload)
    assert response.status_code == 422
