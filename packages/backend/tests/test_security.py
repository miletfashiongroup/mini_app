from __future__ import annotations

import json
import secrets
import time
from typing import ClassVar
from urllib.parse import quote

import pytest
from brace_backend.core.exceptions import AccessDeniedError
from brace_backend.core.security import (
    TELEGRAM_MAX_AGE_SECONDS,
    NonceReplayProtector,
    TelegramInitData,
    build_signature,
    parse_init_data,
    validate_request,
    verify_init_data,
)


@pytest.fixture(autouse=True)
def override_settings(monkeypatch):
    """Force deterministic security settings for every test."""

    class DummySettings:
        environment = "test"
        allow_dev_mode = False
        telegram_bot_token = "unit-test-secret"
        telegram_webapp_secret = None
        telegram_dev_mode = False
        telegram_dev_user: ClassVar[dict] = {"id": 999, "username": "dev"}
        redis_url = "memory://"

        @property
        def telegram_dev_mode_enabled(self) -> bool:
            return (
                self.environment.lower() == "development"
                and self.allow_dev_mode
                and self.telegram_dev_mode
            )

    monkeypatch.setattr("brace_backend.core.security.settings", DummySettings())
    return DummySettings


@pytest.fixture(autouse=True)
def fresh_replay_protector(monkeypatch):
    protector = NonceReplayProtector(redis_url="memory://", ttl=TELEGRAM_MAX_AGE_SECONDS)
    monkeypatch.setattr("brace_backend.core.security._replay_protector", protector)
    return protector


def build_init_header(
    user: dict,
    *,
    auth_date: int,
    nonce: str | None = None,
    secret: str = "unit-test-secret",
) -> str:
    """Construct raw init data string trusted by verify_init_data."""
    payload = {"auth_date": auth_date, "user": user, "nonce": nonce or secrets.token_hex(8)}
    digest = build_signature(payload.copy(), secret_token=secret)
    encoded_user = quote(json.dumps(user))
    return f"auth_date={auth_date}&nonce={payload['nonce']}&user={encoded_user}&hash={digest}"


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
        verify_init_data("auth_date=123&nonce=abc123")


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


def test_verify_init_data_future_timestamp():
    """Timestamps in the future must be rejected to stop replay attacks."""
    future = int(time.time() + 120)
    raw = build_init_header({"id": 4}, auth_date=future)
    with pytest.raises(AccessDeniedError):
        verify_init_data(raw)


def test_verify_init_data_requires_nonce():
    """Missing nonces make replay protection impossible."""
    payload = {"auth_date": int(time.time()), "user": {"id": 1}}
    digest = build_signature(payload.copy(), secret_token="unit-test-secret")
    raw = f"auth_date={payload['auth_date']}&user={quote(json.dumps(payload['user']))}&hash={digest}"
    with pytest.raises(AccessDeniedError):
        verify_init_data(raw)


def test_verify_init_data_detects_replayed_nonce():
    """Re-using a nonce must be stopped even within the TTL window."""
    now = int(time.time())
    header = build_init_header({"id": 6}, auth_date=now, nonce="dup-nonce")
    assert isinstance(verify_init_data(header), TelegramInitData)
    with pytest.raises(AccessDeniedError):
        verify_init_data(header)


def test_verify_init_data_honors_webapp_secret(monkeypatch, override_settings):
    """When telegram_webapp_secret is set it should override the bot token."""
    override_settings.telegram_webapp_secret = "alt-secret"
    raw = build_init_header({"id": 7}, auth_date=int(time.time()), secret="alt-secret")
    assert isinstance(verify_init_data(raw), TelegramInitData)


@pytest.mark.asyncio
async def test_validate_request_requires_header(monkeypatch, override_settings):
    """Request validation without headers should fail even in async context."""
    override_settings.telegram_dev_mode = False
    with pytest.raises(AccessDeniedError):
        await validate_request(None)


@pytest.mark.asyncio
async def test_validate_request_dev_mode(monkeypatch, override_settings):
    """Dev mode bypass should return the configured fake user."""
    override_settings.environment = "development"
    override_settings.allow_dev_mode = True
    override_settings.telegram_dev_mode = True
    init_data = await validate_request(None)
    assert init_data.user["id"] == override_settings.telegram_dev_user["id"]


@pytest.mark.asyncio
async def test_validate_request_dev_mode_locked_outside_dev_env(monkeypatch, override_settings):
    """Dev mode should refuse to run if environment or flags are not aligned."""
    override_settings.telegram_dev_mode = True
    override_settings.allow_dev_mode = False
    with pytest.raises(AccessDeniedError):
        await validate_request(None)
