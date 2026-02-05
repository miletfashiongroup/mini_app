import asyncio
from datetime import datetime, timezone

import pytest

from brace_backend.services import metrika_sender


class DummyResp:
    def __init__(self, status_code: int = 200):
        self.status_code = status_code


@pytest.mark.asyncio
async def test_send_event_builds_params(monkeypatch):
    captured = {}

    async def fake_get(url, params=None):
        captured["url"] = url
        captured["params"] = params
        return DummyResp(200)

    monkeypatch.setattr(metrika_sender, "_CLIENT", type("C", (), {"get": fake_get}))

    await metrika_sender.send_event(
        counter_id=123,
        measurement_token="token123",
        event_name="app_open",
        occurred_at=datetime(2026, 2, 5, tzinfo=timezone.utc),
        client_id="cid123",
        user_id="uid456",
    )

    assert captured["url"] == "https://mc.yandex.ru/collect"
    assert captured["params"]["tid"] == 123
    assert captured["params"]["cid"] == "cid123"
    assert captured["params"]["ea"] == "app_open"
    assert captured["params"]["ms"] == "token123"
    assert captured["params"]["uid"] == "uid456"
    assert captured["params"]["t"] == "event"
    assert captured["params"]["dl"].startswith("https://")
    assert isinstance(captured["params"]["et"], int)


def test_enqueue_events_skips_when_disabled(monkeypatch):
    events = [("app_open", datetime.now(tz=timezone.utc))]
    metrika_sender.settings.metrika_enabled = False
    called = False

    def fake_create_task(coro):
        nonlocal called
        called = True

    monkeypatch.setattr(asyncio, "create_task", fake_create_task)
    metrika_sender.enqueue_events(events=events, client_id="c", user_id=None)
    assert called is False
