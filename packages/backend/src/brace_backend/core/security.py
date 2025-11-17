from __future__ import annotations

import hashlib
import hmac
import json
import time
from typing import Any
from urllib.parse import parse_qsl

from brace_backend.core.config import settings
from brace_backend.core.exceptions import AccessDeniedError


class TelegramInitData:
    """Thin wrapper exposing structured Telegram WebApp payload fields."""

    def __init__(self, data: dict[str, Any]):
        self.data = data

    @property
    def user(self) -> dict[str, Any]:
        return self.data.get("user", {})

    @property
    def auth_date(self) -> int:
        return int(self.data.get("auth_date", 0))


TELEGRAM_MAX_AGE_SECONDS = 60 * 5


def parse_init_data(raw: str) -> dict[str, Any]:
    """Decode Telegram init data query string into Python objects."""
    pairs = parse_qsl(raw, strict_parsing=False)
    data: dict[str, Any] = {}
    for key, value in pairs:
        if key == "user":
            data[key] = json.loads(value)
        else:
            data[key] = value
    return data


def build_data_check_string(payload: dict[str, Any]) -> str:
    """Canonical string builder as described in Telegram WebApp docs."""
    segments = []
    for key, value in sorted(payload.items()):
        if isinstance(value, (dict, list)):
            encoded = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        else:
            encoded = str(value)
        segments.append(f"{key}={encoded}")
    return "\n".join(segments)


def build_signature(payload: dict[str, Any], *, secret_token: str) -> str:
    """Generate the HTTPS-style HMAC signature used by Telegram."""
    if not secret_token:
        raise AccessDeniedError("Telegram bot token is not configured.")
    secret_key = hashlib.sha256(secret_token.encode()).digest()
    check_string = build_data_check_string(payload)
    return hmac.new(secret_key, msg=check_string.encode(), digestmod=hashlib.sha256).hexdigest()


def verify_init_data(init_data: str) -> TelegramInitData:
    if not init_data:
        raise AccessDeniedError("Missing Telegram init data header.")

    parsed = parse_init_data(init_data)
    provided_hash = parsed.pop("hash", None)
    if not provided_hash:
        raise AccessDeniedError("Init data hash is missing.")

    expected_hash = build_signature(parsed, secret_token=settings.telegram_bot_token)
    if not hmac.compare_digest(expected_hash, provided_hash):
        raise AccessDeniedError("Telegram signature is invalid.")

    auth_date = int(parsed.get("auth_date", 0))
    if abs(time.time() - auth_date) > TELEGRAM_MAX_AGE_SECONDS:
        raise AccessDeniedError("Telegram init data has expired.")

    return TelegramInitData(parsed)


async def validate_request(init_data_header: str | None) -> TelegramInitData:
    """Verify Telegram init data header or raise a structured error."""
    if settings.telegram_dev_mode:
        mock_payload = {
            "user": settings.telegram_dev_user,
            "auth_date": int(time.time()),
        }
        return TelegramInitData(mock_payload)
    if not init_data_header:
        raise AccessDeniedError("X-Telegram-Init-Data header is required.")
    return verify_init_data(init_data_header)


__all__ = [
    "TelegramInitData",
    "build_data_check_string",
    "build_signature",
    "parse_init_data",
    "validate_request",
    "verify_init_data",
]
