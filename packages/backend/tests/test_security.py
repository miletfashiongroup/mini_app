from __future__ import annotations

import json
import time
from typing import ClassVar
from urllib.parse import quote

import pytest
from brace_backend.core.exceptions import AccessDeniedError
from brace_backend.core.security import (
    TELEGRAM_MAX_AGE_SECONDS,
    TelegramInitData,
    build_data_check_string,
    parse_init_data,
    validate_request,
    verify_init_data,
)


@pytest.fixture(autouse=True)
def override_settings(monkeypatch):
    """Force deterministic security settings for every test."""

    class DummySettings:
        telegram_bot_token = "unit-test-secret"
        telegram_dev_mode = False
        telegram_dev_user: ClassVar[dict] = {"id": 999, "username": "dev"}

    monkeypatch.setattr("brace_backend.core.security.settings", DummySettings())
    return DummySettings


def build_init_header(user: dict, *, auth_date: int) -> str:
    """Construct raw init data string trusted by verify_init_data."""
    payload = {"auth_date": auth_date, "user": user}
    check_string = build_data_check_string(payload.copy())

    import hashlib
    import hmac

    secret_key = hashlib.sha256(b"unit-test-secret").digest()
    digest = hmac.new(secret_key, msg=check_string.encode(), digestmod=hashlib.sha256).hexdigest()
    return f"auth_date={auth_date}&user={quote(json.dumps(user))}&hash={digest}"


def test_parse_init_data_decodes_user_json():
    """Raw init-data query string should be decoded into Python structures."""
    user = {"id": 42, "first_name": "Unit"}
    raw = f"user={quote(json.dumps(user))}"
    parsed = parse_init_data(raw)
    assert parsed["user"]["id"] == 42


def test_verify_init_data_success(monkeypatch):
    """Valid signatures must be accepted and parsed."""
    raw = build_init_header({"id": 1}, auth_date=int(time.time()))
    result = verify_init_data(raw)
    assert isinstance(result, TelegramInitData)
    assert result.user["id"] == 1


def test_verify_init_data_missing_hash():
    """Missing hash values should raise AccessDeniedError."""
    with pytest.raises(AccessDeniedError):
        verify_init_data("auth_date=123")


def test_verify_init_data_invalid_signature():
    """Tampered payloads must be rejected."""
    wrong_hash = build_init_header({"id": 2}, auth_date=int(time.time()))
    wrong_hash = wrong_hash.replace("hash=", "hash=invalid")
    with pytest.raises(AccessDeniedError):
        verify_init_data(wrong_hash)


def test_verify_init_data_expired():
    """Expired timestamps must be considered invalid."""
    old = int(time.time() - TELEGRAM_MAX_AGE_SECONDS - 10)
    raw = build_init_header({"id": 3}, auth_date=old)
    with pytest.raises(AccessDeniedError):
        verify_init_data(raw)


@pytest.mark.asyncio
async def test_validate_request_requires_header(monkeypatch, override_settings):
    """Request validation without headers should fail even in async context."""
    override_settings.telegram_dev_mode = False
    with pytest.raises(AccessDeniedError):
        await validate_request(None)


@pytest.mark.asyncio
async def test_validate_request_dev_mode(monkeypatch, override_settings):
    """Dev mode bypass should return the configured fake user."""
    override_settings.telegram_dev_mode = True
    init_data = await validate_request(None)
    assert init_data.user["id"] == override_settings.telegram_dev_user["id"]
