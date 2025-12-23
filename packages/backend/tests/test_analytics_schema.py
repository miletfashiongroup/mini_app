from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest

from brace_backend.schemas.analytics import AnalyticsBatchIn


def _payload(event_name: str = "app_open"):
    return {
        "schema_version": 1,
        "session_id": "sess-1",
        "device_id": "dev-1",
        "anon_id": "anon-1",
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


def test_analytics_schema_accepts_valid_payload():
    AnalyticsBatchIn.model_validate(_payload())


def test_analytics_schema_rejects_unknown_event():
    with pytest.raises(Exception):
        AnalyticsBatchIn.model_validate(_payload(event_name="bad_event"))
